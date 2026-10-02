# Automated PR review (Codex)

CI policy for `openai/codex-action`. `AGENTS.md` routes interactive reviews to the parent workspace `review-change` → `functional-reviewer` flow.

## Modes

| PR base branch | Mode | Instructions | Codex effort |
| --- | --- | --- | --- |
| `main` | Functional | [functional.md](functional.md) | `medium` |
| `release` | Release | [release.md](release.md) | `high` |

Raise findings when there is credible evidence of incorrect behaviour or meaningful risk. A clean `findings` list is fine, but `review_log` must explain what was checked.

## Files

| File | Role |
| --- | --- |
| [functional.md](functional.md) | Fast, repo-local functional review |
| [release.md](release.md) | Release-readiness review |
| [output-schema.json](output-schema.json) | Structured findings + required `review_log` |
| [publish-findings.sh](publish-findings.sh) | Posts inline comments + PR digest (CI only) |

The JSON schema applies only to CI. Interactive reviews use their own human-readable evidence-report format.

## Publish gate (tunable)

| Env var | Default | Effect |
| --- | --- | --- |
| `CONFIDENCE_MIN` | `0.65` | Inline comments only for findings at/above this score |
| `PRIORITY_MAX` | `3` | Inline comments for P0–P3 (`priority` ≤ 3) |
| `POST_DIGEST` | `true` | Post/update a PR comment with full output, filtered items, and `review_log` |

## Repo-local scope

This repository is reviewed **standalone**. Do not clone sibling repositories or `zyfai-workspace` for additional context.

## CI configuration

Triggers, model selection, permissions, limits, and ignored paths: [`.github/workflows/codex-pr-review.yml`](../../.github/workflows/codex-pr-review.yml).

## GitHub setup (manual)

Configure `OPENAI_API_KEY` in the `ondefy/zyfai-mcp-server` repository secrets before the workflow runs.
