// Professional easing functions used by GSAP, Framer Motion, etc.

export const easings = {
  // Linear interpolation (what we have now)
  linear: (t: number) => t,
  
  // Exponential decay (like Framer Motion's spring)
  expo: (current: number, target: number, factor = 0.1) => {
    return current + (target - current) * factor
  },
  
  // Spring physics (most natural feeling)
  spring: (current: number, target: number, velocity: number, config = { stiffness: 100, damping: 10 }) => {
    const { stiffness, damping } = config
    const displacement = target - current
    const springForce = displacement * (stiffness / 1000)
    const dampingForce = velocity * (damping / 100)
    const acceleration = springForce - dampingForce
    const newVelocity = velocity + acceleration
    const newPosition = current + newVelocity / 60 // assuming 60fps
    
    return { position: newPosition, velocity: newVelocity }
  },
  
  // Cubic bezier (CSS-like easing)
  cubicBezier: (t: number, p1 = 0.4, p2 = 0.0, p3 = 0.2, p4 = 1.0) => {
    const cx = 3.0 * p1
    const bx = 3.0 * (p3 - p1) - cx
    const ax = 1.0 - cx - bx
    const cy = 3.0 * p2
    const by = 3.0 * (p4 - p2) - cy
    const ay = 1.0 - cy - by
    
    return ((ay * t + by) * t + cy) * t
  }
}

// Smooth damp function (like Unity's SmoothDamp)
export function smoothDamp(
  current: number,
  target: number,
  currentVelocity: { value: number },
  smoothTime: number,
  maxSpeed = Infinity,
  deltaTime = 1/60
) {
  smoothTime = Math.max(0.0001, smoothTime)
  const omega = 2 / smoothTime
  const x = omega * deltaTime
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  
  let change = current - target
  const originalTo = target
  
  // Clamp maximum speed
  const maxChange = maxSpeed * smoothTime
  change = Math.max(-maxChange, Math.min(change, maxChange))
  target = current - change
  
  const temp = (currentVelocity.value + omega * change) * deltaTime
  currentVelocity.value = (currentVelocity.value - omega * temp) * exp
  let output = target + (change + temp) * exp
  
  // Prevent overshooting
  if (originalTo - current > 0.0 === output > originalTo) {
    output = originalTo
    currentVelocity.value = (output - originalTo) / deltaTime
  }
  
  return output
}