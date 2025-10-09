import { useRef, useState, useCallback, useEffect } from 'react';

export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration?: number;
  buffer?: AudioBuffer;
}

export interface DeckState {
  currentSong: Song | null;
  queuedSong: Song | null;
  isPlaying: boolean;
  volume: number;
  position: number;
  isLoading: boolean;
  isQueueLoading: boolean;
}

export interface DJEngineState {
  leftDeck: DeckState;
  rightDeck: DeckState;
  crossfaderValue: number; // -1 (full left) to 1 (full right)
  masterVolume: number;
  isInitialized: boolean;
}

type DeckSide = 'left' | 'right';

export const useDJEngine = () => {
  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const leftDeckGainRef = useRef<GainNode | null>(null);
  const rightDeckGainRef = useRef<GainNode | null>(null);
  const leftCrossfaderGainRef = useRef<GainNode | null>(null);
  const rightCrossfaderGainRef = useRef<GainNode | null>(null);
  const masterAnalyserRef = useRef<AnalyserNode | null>(null);
  
  // Audio sources for each deck
  const leftSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const rightSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Playback tracking
  const leftStartTimeRef = useRef<number>(0);
  const rightStartTimeRef = useRef<number>(0);
  const leftOffsetRef = useRef<number>(0);
  const rightOffsetRef = useRef<number>(0);

  // State
  const [djState, setDJState] = useState<DJEngineState>({
    leftDeck: {
      currentSong: null,
      queuedSong: null,
      isPlaying: false,
      volume: 1,
      position: 0,
      isLoading: false,
      isQueueLoading: false,
    },
    rightDeck: {
      currentSong: null,
      queuedSong: null,
      isPlaying: false,
      volume: 1,
      position: 0,
      isLoading: false,
      isQueueLoading: false,
    },
    crossfaderValue: 0, // Center position
    masterVolume: 1,
    isInitialized: false,
  });

  // Initialize audio context and nodes
  const initializeAudioContext = useCallback(async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create master gain (final output)
      const masterGain = audioContext.createGain();
      masterGainRef.current = masterGain;

      // Create analyser for visualization
      const masterAnalyser = audioContext.createAnalyser();
      masterAnalyser.fftSize = 256;
      masterAnalyser.smoothingTimeConstant = 0.8;
      masterAnalyserRef.current = masterAnalyser;

      // Connect: masterGain -> masterAnalyser -> destination
      masterGain.connect(masterAnalyser);
      masterAnalyser.connect(audioContext.destination);

      // Create deck volume controls
      const leftDeckGain = audioContext.createGain();
      const rightDeckGain = audioContext.createGain();
      leftDeckGainRef.current = leftDeckGain;
      rightDeckGainRef.current = rightDeckGain;

      // Create crossfader controls
      const leftCrossfaderGain = audioContext.createGain();
      const rightCrossfaderGain = audioContext.createGain();
      leftCrossfaderGainRef.current = leftCrossfaderGain;
      rightCrossfaderGainRef.current = rightCrossfaderGain;

      // Connect the audio graph
      // Left: leftDeckGain -> leftCrossfaderGain -> masterGain
      leftDeckGain.connect(leftCrossfaderGain);
      leftCrossfaderGain.connect(masterGain);
      
      // Right: rightDeckGain -> rightCrossfaderGain -> masterGain
      rightDeckGain.connect(rightCrossfaderGain);
      rightCrossfaderGain.connect(masterGain);

      // Set initial volumes
      leftDeckGain.gain.value = djState.leftDeck.volume;
      rightDeckGain.gain.value = djState.rightDeck.volume;
      masterGain.gain.value = djState.masterVolume;
      
      // Set initial crossfader (center position)
      updateCrossfaderGains(0);

      setDJState(prev => ({ ...prev, isInitialized: true }));
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }, [djState.leftDeck.volume, djState.rightDeck.volume, djState.masterVolume]);

  // Update crossfader gains based on crossfader value
  const updateCrossfaderGains = useCallback((value: number) => {
    if (!leftCrossfaderGainRef.current || !rightCrossfaderGainRef.current) return;

    // Convert crossfader value (-1 to 1) to gain values (0 to 1)
    const leftGain = Math.max(0, (1 - value) / 2);
    const rightGain = Math.max(0, (1 + value) / 2);

    leftCrossfaderGainRef.current.gain.value = leftGain;
    rightCrossfaderGainRef.current.gain.value = rightGain;
  }, []);

  // Load and decode audio file (queue if deck is playing)
  const loadSong = useCallback(async (song: Song, deck: DeckSide): Promise<void> => {
    if (!audioContextRef.current) {
      await initializeAudioContext();
    }

    const deckState = deck === 'left' ? djState.leftDeck : djState.rightDeck;
    
    // If clicking the same queued song, dequeue it
    if (deckState.queuedSong?.id === song.id) {
      setDJState(prev => ({
        ...prev,
        [deck + 'Deck']: {
          ...(deck === 'left' ? prev.leftDeck : prev.rightDeck),
          queuedSong: null,
        }
      }));
      return;
    }
    
    // If deck is currently playing, queue the song instead
    if (deckState.isPlaying && deckState.currentSong) {
      setDJState(prev => ({
        ...prev,
        [deck + 'Deck']: { 
          ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
          isQueueLoading: true 
        }
      }));

      try {
        const response = await fetch(song.url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
        
        const songWithBuffer = { ...song, buffer: audioBuffer, duration: audioBuffer.duration };

        setDJState(prev => ({
          ...prev,
          [deck + 'Deck']: {
            ...(deck === 'left' ? prev.leftDeck : prev.rightDeck),
            queuedSong: songWithBuffer,
            isQueueLoading: false,
          }
        }));
      } catch (error) {
        console.error(`Failed to queue song "${song.title}":`, error);
        setDJState(prev => ({
          ...prev,
          [deck + 'Deck']: { 
            ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
            isQueueLoading: false 
          }
        }));
      }
    } else {
      // Load directly if deck is not playing
      setDJState(prev => ({
        ...prev,
        [deck + 'Deck']: {
          ...(deck === 'left' ? prev.leftDeck : prev.rightDeck),
          isLoading: true
        }
      }));

      try {
        const response = await fetch(song.url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);

        const songWithBuffer = { ...song, buffer: audioBuffer, duration: audioBuffer.duration };

        // Reset offset for new song
        const offsetRef = deck === 'left' ? leftOffsetRef : rightOffsetRef;
        offsetRef.current = 0;

        setDJState(prev => ({
          ...prev,
          [deck + 'Deck']: {
            ...(deck === 'left' ? prev.leftDeck : prev.rightDeck),
            currentSong: songWithBuffer,
            isLoading: false,
            position: 0,
          }
        }));
      } catch (error) {
        console.error(`Failed to load song "${song.title}":`, error);
        setDJState(prev => ({
          ...prev,
          [deck + 'Deck']: {
            ...(deck === 'left' ? prev.leftDeck : prev.rightDeck),
            isLoading: false
          }
        }));
      }
    }
  }, [initializeAudioContext, djState.leftDeck, djState.rightDeck]);

  // Play/pause deck (handle queue transitions)
  const togglePlayback = useCallback(async (deck: DeckSide) => {
    if (!audioContextRef.current) {
      await initializeAudioContext();
    }

    const deckState = deck === 'left' ? djState.leftDeck : djState.rightDeck;
    const sourceRef = deck === 'left' ? leftSourceRef : rightSourceRef;
    const gainNode = deck === 'left' ? leftDeckGainRef.current : rightDeckGainRef.current;
    const startTimeRef = deck === 'left' ? leftStartTimeRef : rightStartTimeRef;
    const offsetRef = deck === 'left' ? leftOffsetRef : rightOffsetRef;

    if (!gainNode) return;

    if (deckState.isPlaying) {
      // If there's a queued song, transition to it
      if (deckState.queuedSong?.buffer) {
        // Stop current song
        if (sourceRef.current) {
          sourceRef.current.stop();
          sourceRef.current = null;
        }

        // Reset offset for new song
        offsetRef.current = 0;

        // Start queued song
        const source = audioContextRef.current!.createBufferSource();
        source.buffer = deckState.queuedSong.buffer;
        source.connect(gainNode);
        
        startTimeRef.current = audioContextRef.current!.currentTime;
        source.start(0, 0);
        sourceRef.current = source;

        // Handle song end
        source.onended = () => {
          if (sourceRef.current === source) {
            setDJState(prev => ({
              ...prev,
              [deck + 'Deck']: { 
                ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
                isPlaying: false 
              }
            }));
            sourceRef.current = null;
            offsetRef.current = 0;
          }
        };

        // Update state: move queued song to current
        setDJState(prev => ({
          ...prev,
          [deck + 'Deck']: { 
            ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
            currentSong: deckState.queuedSong,
            queuedSong: null,
            isPlaying: true,
            position: 0,
          }
        }));
        return;
      } else {
        // Normal pause
        if (sourceRef.current) {
          sourceRef.current.stop();
          sourceRef.current = null;
          
          // Calculate offset for resume
          offsetRef.current += audioContextRef.current!.currentTime - startTimeRef.current;
        }
      }
    } else {
      // Play current or queued song
      const songToPlay = deckState.queuedSong || deckState.currentSong;
      if (!songToPlay?.buffer) return;

      // If playing queued song, make it current
      if (deckState.queuedSong) {
        setDJState(prev => ({
          ...prev,
          [deck + 'Deck']: { 
            ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
            currentSong: deckState.queuedSong,
            queuedSong: null,
            position: 0,
          }
        }));
        offsetRef.current = 0;
      }

      // Start playback
      const source = audioContextRef.current!.createBufferSource();
      source.buffer = songToPlay.buffer;
      source.connect(gainNode);
      
      startTimeRef.current = audioContextRef.current!.currentTime;
      source.start(0, offsetRef.current);
      sourceRef.current = source;

      // Handle song end
      source.onended = () => {
        if (sourceRef.current === source) {
          setDJState(prev => ({
            ...prev,
            [deck + 'Deck']: { 
              ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
              isPlaying: false 
            }
          }));
          sourceRef.current = null;
          offsetRef.current = 0;
        }
      };
    }

    setDJState(prev => ({
      ...prev,
      [deck + 'Deck']: { 
        ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
        isPlaying: !deckState.isPlaying 
      }
    }));
  }, [djState, initializeAudioContext]);

  // Set crossfader value
  const setCrossfader = useCallback((value: number) => {
    const clampedValue = Math.max(-1, Math.min(1, value));
    updateCrossfaderGains(clampedValue);
    setDJState(prev => ({ ...prev, crossfaderValue: clampedValue }));
  }, [updateCrossfaderGains]);

  // Set deck volume
  const setDeckVolume = useCallback((deck: DeckSide, volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const gainNode = deck === 'left' ? leftDeckGainRef.current : rightDeckGainRef.current;
    
    if (gainNode) {
      gainNode.gain.value = clampedVolume;
    }

    setDJState(prev => ({
      ...prev,
      [deck + 'Deck']: { 
        ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
        volume: clampedVolume 
      }
    }));
  }, []);

  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = clampedVolume;
    }
    setDJState(prev => ({ ...prev, masterVolume: clampedVolume }));
  }, []);

  // Get frequency data for visualization
  const getFrequencyData = useCallback(() => {
    if (!masterAnalyserRef.current) return new Uint8Array(0);
    
    const bufferLength = masterAnalyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    masterAnalyserRef.current.getByteFrequencyData(dataArray);
    return dataArray;
  }, []);

  // Seek within current song (seconds)
  const seekDeck = useCallback(async (deck: DeckSide, seconds: number) => {
    if (!audioContextRef.current) {
      await initializeAudioContext();
    }

    const deckState = deck === 'left' ? djState.leftDeck : djState.rightDeck;
    const sourceRef = deck === 'left' ? leftSourceRef : rightSourceRef;
    const gainNode = deck === 'left' ? leftDeckGainRef.current : rightDeckGainRef.current;
    const startTimeRef = deck === 'left' ? leftStartTimeRef : rightStartTimeRef;
    const offsetRef = deck === 'left' ? leftOffsetRef : rightOffsetRef;

    const song = deckState.currentSong;
    if (!song?.buffer || !gainNode) return;

    const duration = song.duration || song.buffer.duration;
    const target = Math.max(0, Math.min(seconds, Math.max(0, duration - 0.01)));
    const wasPlaying = deckState.isPlaying;

    // Stop current source if any
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch {}
      sourceRef.current = null;
    }

    // Set new offset
    offsetRef.current = target;

    if (wasPlaying) {
      // Start new source at target offset
      const source = audioContextRef.current!.createBufferSource();
      source.buffer = song.buffer;
      source.connect(gainNode);
      startTimeRef.current = audioContextRef.current!.currentTime;
      source.start(0, target);
      sourceRef.current = source;

      source.onended = () => {
        if (sourceRef.current === source) {
          setDJState(prev => ({
            ...prev,
            [deck + 'Deck']: { 
              ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
              isPlaying: false 
            }
          }));
          sourceRef.current = null;
          offsetRef.current = 0;
        }
      };
    }

    // Update position in state (keep isPlaying the same)
    setDJState(prev => ({
      ...prev,
      [deck + 'Deck']: {
        ...(deck === 'left' ? prev.leftDeck : prev.rightDeck),
        position: target,
      }
    }));
  }, [djState, initializeAudioContext]);

  // Get deck progress (0..1)
  const getDeckProgress = useCallback((deck: DeckSide) => {
    const deckState = deck === 'left' ? djState.leftDeck : djState.rightDeck;
    const startTimeRef = deck === 'left' ? leftStartTimeRef : rightStartTimeRef;
    const offsetRef = deck === 'left' ? leftOffsetRef : rightOffsetRef;
    const duration = deckState.currentSong?.duration || deckState.currentSong?.buffer?.duration || 0;
    if (!duration) return 0;
    let current = offsetRef.current;
    if (deckState.isPlaying && audioContextRef.current) {
      current += audioContextRef.current.currentTime - startTimeRef.current;
    }
    return Math.max(0, Math.min(1, current / duration));
  }, [djState]);

  // Initialize on mount
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!djState.isInitialized) {
        initializeAudioContext();
      }
      // Remove listener after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    // Add listeners for user interaction (required for audio context)
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [djState.isInitialized, initializeAudioContext]);

  // Navigate to next song in queue (maintaining playback state)
  const nextSong = useCallback(async (deck: DeckSide, playlist: Song[]) => {
    if (!audioContextRef.current) {
      await initializeAudioContext();
    }

    const deckState = deck === 'left' ? djState.leftDeck : djState.rightDeck;
    const currentSong = deckState.currentSong;
    
    if (!currentSong || playlist.length === 0) return;
    
    // Find current song index in playlist
    const currentIndex = playlist.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return;
    
    // Get next song (loop to beginning if at end)
    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextSongToPlay = playlist[nextIndex];
    
    // Remember if we were playing
    const wasPlaying = deckState.isPlaying;

    // Reset offset for new song
    const offsetRef = deck === 'left' ? leftOffsetRef : rightOffsetRef;
    offsetRef.current = 0;

    // Stop current playback if playing
    if (wasPlaying) {
      const sourceRef = deck === 'left' ? leftSourceRef : rightSourceRef;
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
    }

    // Load the next song directly
    try {
      setDJState(prev => ({
        ...prev,
        [deck + 'Deck']: { 
          ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
          isLoading: true 
        }
      }));

      const response = await fetch(nextSongToPlay.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
      
      const songWithBuffer = { ...nextSongToPlay, buffer: audioBuffer, duration: audioBuffer.duration };

      // Update state with new song
      setDJState(prev => ({
        ...prev,
        [deck + 'Deck']: {
          ...(deck === 'left' ? prev.leftDeck : prev.rightDeck),
          currentSong: songWithBuffer,
          isLoading: false,
          position: 0,
          isPlaying: wasPlaying, // Maintain playing state
        }
      }));

      // If we were playing, start the new song immediately
      if (wasPlaying) {
        const sourceRef = deck === 'left' ? leftSourceRef : rightSourceRef;
        const gainNode = deck === 'left' ? leftDeckGainRef.current : rightDeckGainRef.current;
        const startTimeRef = deck === 'left' ? leftStartTimeRef : rightStartTimeRef;

        if (gainNode) {
          const source = audioContextRef.current!.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(gainNode);
          
          startTimeRef.current = audioContextRef.current!.currentTime;
          source.start(0, 0);
          sourceRef.current = source;

          // Handle song end
          source.onended = () => {
            if (sourceRef.current === source) {
              setDJState(prev => ({
                ...prev,
                [deck + 'Deck']: { 
                  ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
                  isPlaying: false 
                }
              }));
              sourceRef.current = null;
            }
          };
        }
      }
    } catch (error) {
      console.error(`Failed to load next song "${nextSongToPlay.title}":`, error);
      setDJState(prev => ({
        ...prev,
        [deck + 'Deck']: { 
          ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
          isLoading: false 
        }
      }));
    }
  }, [djState, initializeAudioContext]);

  // Navigate to previous song in queue (maintaining playback state)
  const previousSong = useCallback(async (deck: DeckSide, playlist: Song[]) => {
    if (!audioContextRef.current) {
      await initializeAudioContext();
    }

    const deckState = deck === 'left' ? djState.leftDeck : djState.rightDeck;
    const currentSong = deckState.currentSong;
    
    if (!currentSong || playlist.length === 0) return;
    
    // Find current song index in playlist
    const currentIndex = playlist.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return;
    
    // Get previous song (loop to end if at beginning)
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    const prevSongToPlay = playlist[prevIndex];

    // Remember if we were playing
    const wasPlaying = deckState.isPlaying;

    // Reset offset for new song
    const offsetRef = deck === 'left' ? leftOffsetRef : rightOffsetRef;
    offsetRef.current = 0;

    // Stop current playback if playing
    if (wasPlaying) {
      const sourceRef = deck === 'left' ? leftSourceRef : rightSourceRef;
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
    }

    // Load the previous song directly
    try {
      setDJState(prev => ({
        ...prev,
        [deck + 'Deck']: { 
          ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
          isLoading: true 
        }
      }));

      const response = await fetch(prevSongToPlay.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
      
      const songWithBuffer = { ...prevSongToPlay, buffer: audioBuffer, duration: audioBuffer.duration };

      // Update state with new song
      setDJState(prev => ({
        ...prev,
        [deck + 'Deck']: {
          ...(deck === 'left' ? prev.leftDeck : prev.rightDeck),
          currentSong: songWithBuffer,
          isLoading: false,
          position: 0,
          isPlaying: wasPlaying, // Maintain playing state
        }
      }));

      // If we were playing, start the new song immediately
      if (wasPlaying) {
        const sourceRef = deck === 'left' ? leftSourceRef : rightSourceRef;
        const gainNode = deck === 'left' ? leftDeckGainRef.current : rightDeckGainRef.current;
        const startTimeRef = deck === 'left' ? leftStartTimeRef : rightStartTimeRef;

        if (gainNode) {
          const source = audioContextRef.current!.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(gainNode);
          
          startTimeRef.current = audioContextRef.current!.currentTime;
          source.start(0, 0);
          sourceRef.current = source;

          // Handle song end
          source.onended = () => {
            if (sourceRef.current === source) {
              setDJState(prev => ({
                ...prev,
                [deck + 'Deck']: { 
                  ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
                  isPlaying: false 
                }
              }));
              sourceRef.current = null;
            }
          };
        }
      }
    } catch (error) {
      console.error(`Failed to load previous song "${prevSongToPlay.title}":`, error);
      setDJState(prev => ({
        ...prev,
        [deck + 'Deck']: { 
          ...(deck === 'left' ? prev.leftDeck : prev.rightDeck), 
          isLoading: false 
        }
      }));
    }
  }, [djState, initializeAudioContext]);

  return {
    djState,
    loadSong,
    togglePlayback,
    nextSong,
    previousSong,
    setCrossfader,
    setDeckVolume,
    setMasterVolume,
    getFrequencyData,
    seekDeck,
    getDeckProgress,
    initializeAudioContext,
  };
};
