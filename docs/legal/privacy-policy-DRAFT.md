# Gamify Privacy Policy (DRAFT for attorney review)

**Status:** draft written by the development team on 2026-10-24 to describe
what the software actually does. It is not legal advice and must be reviewed
and finished by an attorney before it is published. Items marked **[Attorney]**
need a legal decision.

## 1. Who we are
Gamify ("we") is a classroom game platform owned and operated by
Vermont Literacy Network LLC (owner's decision, 2026-10-26; **[Attorney: confirm
the assignment and trade name]**), contact
**[support email on the bought domain]**.

## 2. Who uses Gamify
- **Teachers** (adults) make accounts, question sets, classes and themes.
- **Students** (including children under 13) play games their teacher sets up.
  Students never make accounts and never give an email address.
- **School and district buyers** purchase school plans.

## 3. What we collect, and why
| Who | What | Why | Where it lives |
|---|---|---|---|
| Teacher | Name shown to students, email (cloud accounts), username and password | Sign-in and support | Our database (Supabase, United States) **[Attorney: confirm region and subprocessor terms]** |
| Teacher | Question sets, classes, themes, settings | The service itself | Our database |
| Teacher | Plan and billing status | Paid plans | Stripe (we never see full card numbers) |
| Student | First name or nickname the teacher types, two sign-in pictures, per-student supports the teacher sets | Sign-in and accommodations | Our database, inside the teacher's class |
| Student | Answers in games (question, answer, tries, time) | Teacher reports | Our database, inside the teacher's class |
| Student (game code) | A silly name from the name dice | Showing who is playing | Only for that game |
| Anyone | Tell Gamify reports (bug, problem or idea, optional text, page, device type) | Fixing problems | Our database; student reports never carry a name |

We do **not** collect: student emails, student photos, location, contacts,
advertising identifiers, or browsing history.

## 4. What we never do
- No advertising on any page, and no ad networks.
- No third-party trackers or analytics on any page students use; student pages
  set no cookies (checked by an automated test on every release).
- No selling or renting of personal information, ever.
- No using student information to build profiles or target anything.
- No prices, upgrade prompts or purchases on student screens.

## 5. Children's privacy (COPPA) and schools (FERPA)
- Gamify relies on the school's authorization to collect student information
  for an educational purpose, as allowed for school-directed services
  **[Attorney: confirm COPPA school-authorization approach and wording]**.
- Student information belongs to the school. We act as a "school official"
  under the school's direct control for FERPA purposes **[Attorney]**.
- We offer a Data Privacy Agreement to schools and districts **[Attorney:
  prepare DPA; consider the Student Data Privacy Consortium template]**.
- State student-privacy laws (for example Vermont's Student Privacy Act)
  **[Attorney: list and confirm compliance]**.

## 6. Who we share with (subprocessors)
- Supabase (database and sign-in) **[Attorney]**
- Vercel (hosting) **[Attorney]**
- Stripe (payments, teacher accounts only) **[Attorney]**
- A text-to-speech service, if a natural voice is turned on later; only the
  question text is sent, never who is answering **[Attorney, if added]**
We share nothing else except when the law requires it.

## 7. Keeping, downloading and deleting data
- Teachers can download all their data and delete all of it at any time
  (Account page).
- Deleting a class deletes its students, assignments and answers.
- When a plan ends or shrinks, nothing is deleted; extra items become read-only.
- **[Attorney: retention period after an account is closed, and backups]**

## 8. Security
Data is sent over HTTPS, stored with access rules so teachers only see their
own classes, and backed up **[Attorney/engineering: confirm backup schedule and
breach-notification process]**.

## 9. Changes and contact
We will tell teachers by email before material changes. Questions:
**[support email]**.
