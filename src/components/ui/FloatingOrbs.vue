<template>
  <div class="floating-orbs">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    <div class="orb orb-4"></div>
    <div class="orb orb-5"></div>
    <div class="orb orb-6"></div>
  </div>
</template>

<script setup>
// No script needed for this decorative component
</script>

<style scoped>
.floating-orbs {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(1px);
  animation: float 6s ease-in-out infinite;
}

.orb-1 {
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 70%, transparent 100%);
  top: 10%;
  right: 15%;
  animation-delay: 0s;
  animation-duration: 8s;
}

.orb-2 {
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0.04) 70%, transparent 100%);
  top: 60%;
  right: 10%;
  animation-delay: -2s;
  animation-duration: 10s;
}

.orb-3 {
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.03) 70%, transparent 100%);
  top: 30%;
  left: 20%;
  animation-delay: -4s;
  animation-duration: 7s;
}

.orb-4 {
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, rgba(124, 58, 237, 0.02) 70%, transparent 100%);
  bottom: 20%;
  left: 10%;
  animation-delay: -1s;
  animation-duration: 9s;
}

.orb-5 {
  width: 40px;
  height: 40px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.03) 70%, transparent 100%);
  top: 80%;
  right: 30%;
  animation-delay: -3s;
  animation-duration: 6s;
}

.orb-6 {
  width: 70px;
  height: 70px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 70%, transparent 100%);
  top: 15%;
  left: 60%;
  animation-delay: -5s;
  animation-duration: 11s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) translateX(0px) scale(1);
    opacity: 0.7;
  }
  25% {
    transform: translateY(-20px) translateX(10px) scale(1.1);
    opacity: 0.9;
  }
  50% {
    transform: translateY(-10px) translateX(-15px) scale(0.9);
    opacity: 0.6;
  }
  75% {
    transform: translateY(-30px) translateX(5px) scale(1.05);
    opacity: 0.8;
  }
}

/* Hide orbs on mobile to improve performance */
@media (max-width: 768px) {
  .floating-orbs {
    display: none;
  }
}
</style>
