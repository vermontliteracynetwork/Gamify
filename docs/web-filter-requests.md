# Web filter categorization (dev plan: launch readiness)

The dev plan item: "test on a filtered school network; ask web filters to
list Gamify as education (during the beta)". This part can only be sent once
the domain is live, so it is on Waiting on you.

## Ready now (2026-11-25)

- **One address only.** Gamify loads everything from its own domain: pages,
  fonts, pictures and sounds. No third-party scripts, ads or trackers, checked
  on 14 public, student and teacher pages. The other addresses are:
  - the cloud for saved work and live games (HTTPS plus secure WebSocket);
  - GIPHY and Unsplash, only for pictures a teacher added.

  All of these are listed on the For school IT page (/it).
- **The site says what it is.** The home page has a page description and
  sharing tags that call it a K-12 classroom review game site.
- **robots.txt** lets public pages be indexed and keeps student and teacher
  pages out of search results.

## To send once the domain is live

Ask each filter vendor schools commonly use to categorize the domain as
**Education** (and "Educational Games" where offered). Filters to cover:
GoGuardian, Securly, Lightspeed Systems, Cisco Umbrella, iboss, Fortinet
FortiGuard, Palo Alto URL Filtering, Zscaler and ContentKeeper.

- Each vendor has a public site-review or recategorization form; use the
  vendor's own form.
- Give the domain, "K-12 education: classroom review games made from teachers'
  own question sets", and say there are no ads, no chat and no
  user-to-user messaging.

## The live test during the beta

With a beta school's IT, on their filtered network:
1. Open /check on a student Chromebook.
2. Join a Live game from a code.
3. Play a round with sound.

Note any blocked request on the Status page (/status), and send the fix to the
vendor.
