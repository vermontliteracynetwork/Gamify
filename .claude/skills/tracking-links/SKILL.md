---
name: tracking-links
description: "Build Gamify campaign names and UTM tracking links that follow the marketing bible's naming convention, for organic posts, Meta and Google ads, and email. Adapted from irinabuht12-oss/marketing-skills (MIT). Use whenever a post or ad needs a link."
argument-hint: "[post id | campaign id]"
---

# Tracking links

Adapted from irinabuht12-oss/marketing-skills `utm-tracking-generator` and
`campaign-naming-convention-builder` (MIT, see `.claude/THIRD_PARTY.md`).

## Campaign name
`[platform]_[objective]_[funnel]_[audience]_[message]_[yyyymm]`, all lowercase,
hyphens inside a part, underscores between parts (bible section 9).

## UTM link
`{landing}?utm_source={source}&utm_medium={medium}&utm_campaign={campaign}&utm_content={post id}`

| Where | utm_source | utm_medium |
|---|---|---|
| Instagram organic | instagram | social |
| Facebook organic | facebook | social |
| Pinterest organic | pinterest | social |
| TikTok organic | tiktok | social |
| Meta ads | meta | paid-social |
| Google ads | google | cpc |
| Email | newsletter | email |

Meta ads may use dynamic values: `utm_campaign={{campaign.name}}&utm_content={{ad.name}}`
(name ads with the post id). Google: add `utm_term={keyword}`.

Rules: lowercase, no spaces, never put names or emails in a link, never add trackers to
student pages. Until the domain is live, write `{site}` for the domain. Put the link on
the post in the planner.
