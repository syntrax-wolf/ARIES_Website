# TDD

The four seams still apply to new work. Tests talk to the public function only.

Seams are listed in `docs/migration/spec.md` (Permissions, Gate, Content store, Upload policy). Do not add a fifth seam without updating the spec.

UI-only changes use a manual check, not component snapshot tests. The rewrite tickets (01–18) are done.
