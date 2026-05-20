# WI-012 After Proposal - Modal Close Buttons Lack Guaranteed 44px Target

Every modal close control has a predictable 44px minimum tap box while preserving the visual style.

Verification:
- Compare against `../before/mobile-04-menu-open.png`.
- All `.modal-close` elements measure at least 44 by 44 CSS pixels.
- Close button alignment remains correct in modal headers.
