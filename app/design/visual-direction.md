# Roam visual direction

The landing page presents one obvious next action: enter an eight-character fair code. Browsing public fairs is a secondary path; Create a fair and Sign in sit together below it as quiet account actions. The first screen shows no sample listings, account form, or explanatory introduction. Each secondary path opens its own view or panel.

Inside a fair, a ten by ten grid starts the hall and grows when no well-spaced booth position remains. The current grid extent remains the source of positions and booth footprints. The visible map is a top-down indoor fair hall: one continuous tile pattern across the floor, small furnishing details, and person-shaped avatars. Booth spacing leaves room to walk; the floor does not draw fixed paths that booths might cover. A booth footprint reads as a furnished area within that hall rather than a separate building or an outlined grid cell. Clicking any part of its area selects the booth; moving into its footprint still governs open calls and representative controls. A compact minimap shows booth footprints, people, and the visible area; selecting a point in it pans the camera without moving the avatar.

The fair always uses the Kenney hall. Booths use a small set of stable visual variants chosen from each booth ID: different rug colors, table and chair arrangements, and an occasional potted plant. Keep the variants legible at small booth sizes and leave an open approach from the surrounding floor. Hall plants appear only outside booth footprints. Collision shapes follow the furniture and plant pots actually drawn in each variant, leaving space around them for conversation.

Use exact sprites from Kenney's Roguelike Indoors sheet for the tables, chairs, plants, candles, piano, cabinets, and bookshelves. Cabinets belong inside booths only. A candle may sit on a table and shares that table's floor footprint. Larger floor furniture needs a matching obstacle. Hall furniture disappears when a booth covers its position, just as hall plants do. The landing page can repeat the other sprites at low contrast behind its entry card; only its visitors move.
When an object spans several Kenney tiles, assemble its 16 × 16 tiles without the transparent spacing from the source sheet. Keep the object's drawn borders and details intact.

Do not show a hitbox control or collision outlines in the visitor interface. Do not draw the walker's collision circle under the avatar; its ordinary ground shadow is enough to show where the avatar stands.

The hall fills the viewport so it feels like a place to explore. Its title and waiting requests float over the map. Selecting a booth opens a floating information panel; the visitor may collapse it to a small label and expand it again. A circular directory control opens the booth list and organizer tools without taking permanent map space. Movement does not need a persistent instruction pill.

The directory starts as a short list of booth names and sizes. Opening a booth row reveals its description, representatives, and map action. Organizer forms stay behind a separate Manage booth disclosure, with short labels and no repeated instructions. Deleting a booth uses an inline confirmation that names it and explains that any call and invitations will end.
In both the directory and selected booth panel, show a booth description only when it contains meaningful booth-specific text. Suppress the old demo instructions about representatives opening a video call and visitors walking in for its link; they are placeholder copy, not a useful description.

Each person remains the same rendered avatar as its fractional position changes. Movement briefly animates the avatar's limbs and facing direction. The visitor's own movement begins as soon as a directional key is accepted, then the server confirms or corrects it. Reduced-motion settings remove the animation while preserving the final position.

A held arrow or WASD key moves continuously until release. Releasing the key, losing window focus, or leaving the fair stops held movement.
Routine contact with furniture or a rejected position update corrects the avatar without placing a red error banner in the booth panel. Keep visible errors for failures that need a person to act, such as a lost server connection.

The booth panel leads with the booth name and the actions relevant to the selected booth. When an invite-only queue is active, queue actions come before call settings so representatives can invite waiting visitors immediately. The panel has a fixed maximum height within the fair view, a persistent header, and a scrollable content area so every queue action stays reachable even when the roster grows. Keep queue names readable within the panel. Do not show a separate conversation-status card or redundant representative status text and divider lines. A waiting request remains visible when the visitor selects another booth. Organizer and representative controls remain available below the immediate queue actions.

Do not show transient toast notifications for routine actions such as signing in, preparing a meeting link, or inviting visitors. The call action should say “Open video call” and open the meeting directly after Roam checks access to the link. If a call cannot be opened, keep a visible inline error near the relevant controls.

For attendees, label the next action before its controls, including when that action is an invitation. Keep the call and leave-queue controls visually separate in the expanded booth panel.

Use night blue for the frame and calm surfaces, white or soft blue for cards, one violet action color, and small warm accents. Headings can have more weight and personality; supporting text stays plain and easy to scan. The map should feel inhabited through furniture and subtle avatar motion without busy background decoration. Respect reduced-motion preferences.
