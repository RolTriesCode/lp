STEP:
45 — Landing Page Motion

REASONING:
HIGH

OBJECTIVE:
Add carefully designed GSAP and ScrollTrigger motion to the completed landing page without compromising accessibility or performance.

REFERENCE:
Sections 5, 22, and 29 of `implementation.md`, plus the completed landing composition

FILES / AREAS:
Landing animation modules, GSAP client boundaries, responsive motion styles, reduced-motion handling, performance checks

IMPLEMENTATION:
- Read current GSAP React integration documentation and install GSAP only if it is not already present.
- Define a restrained motion system that supports narrative hierarchy, product demonstrations, and spatial continuity.
- Use `gsap.context`, scoped refs, and complete cleanup for every React animation.
- Use ScrollTrigger only for landing-page sequences that materially benefit from scroll-linked storytelling.
- Animate transforms and opacity, batch measurements, and avoid layout thrashing.
- Use `gsap.matchMedia` to provide responsive behavior and a no-motion or minimal-motion experience for `prefers-reduced-motion`.
- Ensure content remains visible and usable before JavaScript and during animation setup.
- Test fast scrolling, route navigation, resize, mobile touch scrolling, and repeated mounts for stale triggers or memory leaks.

DO NOT:
- Add scroll-jacking, excessive parallax, unnecessary pinning, long intro gates, or motion to productivity screens.
- Animate core content in a way that delays reading or interaction.
- Use Motion and GSAP on the same element.

ACCEPTANCE CRITERIA:
- Motion improves storytelling and remains restrained.
- Reduced-motion mode exposes all content without animated dependencies.
- Scrolling remains native, smooth, and responsive.
- No stale triggers, hydration errors, layout shifts, or material performance regressions occur.
