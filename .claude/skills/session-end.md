# Session End Summary

End-of-session skill for capturing what was accomplished and appending to the session log.

## Instructions

When this skill is invoked:

1. **Prompt the user** for a brief session summary if not provided:
   - What was accomplished?
   - Any key decisions made?
   - What's left to do?

2. **Format the entry** with today's date and timestamp

3. **Append to** `docs/session-log.md` (create if doesn't exist)

4. **Format:**
```markdown
### [YYYY-MM-DD HH:MM] Session Summary

**Accomplished:**
- [bullet points]

**Decisions:**
- [any decisions made, reference docs/decisions.md if logged there]

**Next Steps:**
- [what remains]

---
```

5. **If a significant decision was made**, also add an entry to `docs/decisions.md`

6. **Commit the changes** with message: "docs: session summary [date]"
