# Accessibility

ZhiSh aims to be usable by everyone, including people who use keyboards, screen readers, magnification, voice input, or other assistive technology. Accessibility is part of product quality, not an afterthought.

This is an open-source project, and our accessibility work is ongoing. We do not claim full conformance with any standard unless we have completed a formal evaluation and published its scope, date, method, and evaluator.

## Current priorities

We currently focus on:

- **Keyboard access**: core interfaces should be usable without a mouse.
- **Screen reader compatibility**: key controls should have accessible names and states.
- **Clear content**: documentation and interface text should use plain language where possible.
- **Color and contrast**: information should not be conveyed by color alone.

We use **WCAG 2.2 AA** as an aspirational target. This is **a goal, not a verified conformance claim**. We have not yet completed a formal audit.

## Language and localization

ZhiSh is developed with **Chinese as the primary language**. The user interface is currently **Chinese-only**.

Other languages are **not officially maintained**. If you need a non-Chinese interface, you will need to make secondary modifications or provide your own translation/localization. We do not currently provide official translations and cannot guarantee that non-Chinese interfaces work correctly or are fully accessible.

## Contributor expectations

If your change affects the interface, documentation, or output format:

- New or changed interactive elements should be keyboard-operable, with visible focus.
- Images, charts, and icon buttons should have alternative text or accessible names.
- If your change affects visual presentation, describe in the PR whether you checked contrast or zoom.
- If your change affects screen reader behavior, state how you tested it (for example, NVDA, VoiceOver, or TalkBack) or note that it was not tested.
- If your change introduces user-facing text, keep in mind that the primary interface language is Chinese. Do not assume that adding another language is officially supported.

We do **not currently have mandatory CI accessibility checks**. Do not assume accessibility is fine just because a tool reports no errors.

## Reporting accessibility issues

The most direct way to report a barrier is to **open a GitHub issue**:

https://github.com/Rainycrew/ZhiSh/issues

Please include, where possible:

- The task you were trying to complete (for example, “open settings” or “export data”)
- Where you encountered the barrier (page, feature, or documentation link)
- What you observed
- Your browser and operating system, if relevant
- Any assistive technology you used (optional, for example screen reader name and version)

**You do not need to disclose a disability or provide medical information.** Screenshots or recordings are optional, not required. If you cannot use GitHub, you can contact the maintainers at {{backup contact, e.g. email}}.

### How we respond

- We will acknowledge reports **within 7 business days**.
- If we can reproduce the issue, we will explain its severity and the general direction for handling it.
- If we cannot fix it in the short term, we will try to provide a workaround or document the limitation.
- After a fix, we welcome help verifying it.

These timelines are best-effort targets, not legal commitments.

## Ownership and maintenance

Accessibility-related work is currently owned by **{Xiaowuya~/tiktokapp@foxmail}**. Responsibilities include reviewing accessibility issues, confirming severity, and checking basic accessibility impact before releases.

This statement will be reviewed **at least every 6 months**, or earlier after major interface changes. If ownership changes, this file will be updated in the repository.

## Known limitations

We have **not yet conducted systematic assistive technology compatibility testing**. This means there may be undocumented issues, especially in:

- Screen reader reading order and state announcements in complex interactions
- Layout at high zoom levels
- Completing all core flows using only a keyboard
- **Official distribution platforms**: the current official releases support Android and Windows x64. No official macOS or Linux binary distribution is currently provided.
- **Non-Chinese interfaces**: the project is Chinese-first and the interface is currently Chinese-only. Other languages require secondary modification or localization and are not officially maintained.

If you encounter a specific barrier, please report it using the process above. We will prioritize recording and evaluating it.

## Supported environments

The following environments have **not been formally verified** and are listed only based on development and usage so far:

- **Official distribution**: Android and Windows x64. These are the official binary release targets currently provided.
- **Source-based usage**: ZhiSh is built with Vue. The source code can be run on Windows, macOS, Linux, and other platforms with a suitable environment, but this is not an official binary distribution and has not been formally verified.
- **Browsers** (when running from source): recent desktop versions of Chrome, Edge, Firefox, and Safari. These have not been formally tested.
- **Operating systems**: Android and Windows x64 for official releases; macOS, Linux, and other platforms may be possible via source-based usage, but are not officially verified.
- **Input methods**: keyboard and mouse; touch and voice input are **untested**.
- **Assistive technology**: **no formal compatibility testing has been performed**. If you use a screen reader or other assistive technology, your feedback is especially valuable.
- **Languages**: Chinese is the primary and currently the only officially supported interface language. Other languages are **not officially supported** and require secondary modification or localization.

**A combination not listed here does not mean “unsupported”; it means we do not yet have enough information to make a judgment.**

## Feedback and improvements

If you have suggestions for improving this statement or ZhiSh’s accessibility practices, please **open an issue** or start a discussion if Discussions are enabled. If you are reporting an actual barrier, please use the reporting process above.
