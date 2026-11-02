# P5 study setup for Demo Fair

This is the repeatable setup for the two P5 user studies. The [public fair](https://roam.mit-sdg.dev/?fair=3ad1c425-b262-4e52-9784-94c4e38894d3) has code `3BC7D6B4`. Participants who are testing fair entry should start at [Roam](https://roam.mit-sdg.dev/) with the code, rather than at the direct fair URL.

**Current setup (November 2):** all six booth records are live and visible to a guest. The open group link is saved on Lantern Robotics. A live rehearsal verified open group mode, a guest request, a representative invitation, and opening the distinct invite-only meeting link. The rehearsal queue was cleared and Lantern Robotics was restored to open group mode; [the guest view shows it live](p5-evidence/open-group-ready.png). Recheck this state immediately before each participant session because the representative's session or presence can expire. Meeting URLs are intentionally omitted from this public repository.

## Fair content

These six booths were saved as ordinary persisted records in the deployed app on November 2 and checked in the guest directory. The organizations are fictional but give visitors believable, distinct reasons to approach them. Roam placed the booths automatically. No names or descriptions are encoded in application source.

| Booth | Size | Description | Study role |
| --- | --- | --- | --- |
| Lantern Robotics | Medium | Build small robots in beginner-friendly teams. This term's projects include a line-following rover and a recycling sorter. New members can come to Thursday build nights without prior experience. | Open group, then invite-only conversation and waiting queue |
| Open Maps Collective | Medium | Map campus routes and nearby transit access with students who use them. Current volunteers are checking step-free entrances and confusing transfers; drop by to discuss a route or join a mapping session. | Discovery option |
| Campus Garden Lab | Small | Grow herbs and vegetables in raised beds and test inexpensive soil sensors. Weekly garden shifts are open to first-time growers. | No active call |
| Sound & Code | Medium | Make music with software, sensors, and homemade instruments. Members share experiments at monthly listening nights and welcome people from both music and computing. | Discovery option |
| Makers' Stage | Small | Build props, lighting effects, and interactive scenery for student performances. The next workshop covers simple LED controls and safe fabrication. | Discovery option |
| Civic Data Studio | Medium | Work with public data to answer local questions, from bus reliability to access to public spaces. Teams meet on Saturdays and publish their methods alongside results. | Discovery option |

The original `6104` placeholder was edited into Lantern Robotics. [Guest-view evidence](p5-evidence/guest-fair.png) shows all six booths in the live fair.

## Accounts and live states

- The Demo Fair organizer, `Hunter`, owns all booth records and is automatically listed as representative on each. Keep that account signed in only in the facilitator's organizer window. A representative must be in the assigned booth to host its call.
- Use real, study-controlled video meeting URLs. The open group and invite-only calls must use **different** URLs. Roam rejects a switch from an open group call to an invite-only call that reuses the link.
- With the current single representative account, run the live states sequentially at Lantern Robotics: start an open group call; after that task, switch it to invite-only with the distinct private link and requests enabled. This transition is scripted and should be recorded in the study notes. Do not seed fake visitor accounts or automated movement.
- The facilitator sends an invitation from the Lantern Robotics representative session after the participant requests a turn. Use the same neutral timing rule in both studies, such as after the participant has moved away and spent one minute exploring another booth.

## Reset and verification for each participant

1. Confirm the public fair contains the six booths and descriptions. Sign in as `Hunter`, enter Lantern Robotics, and start its open group call from the saved meeting link immediately before the participant begins. Record the time and any deviations.
2. Use a fresh browser profile or guest session for the participant. Verify there is no prior request or invitation attached to that identity.
3. From a separate guest session, confirm booth search, map selection, and open group access from inside Lantern Robotics. After switching to invite-only, confirm a guest can request a turn there. Clear any rehearsal request before the study.
4. Confirm the facilitator can see the Lantern Robotics waiting order and send an invitation. Check that the invitation appears for the correct visitor and the link opens before its two-minute expiry.
5. After the first study, switch the call back to open group using the original group link; this clears the queue. Verify the second participant starts from the same setup. Record any differences rather than silently changing the script.

The facilitator should not guide participants to a booth or explain a control. Every intervention and any departure from this setup belongs in the study notes and reports.
