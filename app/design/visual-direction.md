# Roam visual direction

The landing page presents one obvious next action: enter an eight-character fair code. Browsing public fairs and creating a fair are secondary paths. The first screen shows no sample listings, account form, or explanatory introduction. Each secondary path opens its own view or panel.

Inside a fair, the ten by ten grid remains the source of positions and booth footprints. The visible map is a top-down indoor fair hall: a continuous tiled floor, aisle, small furnishing details, and person-shaped avatars. A booth footprint reads as a furnished area within that hall rather than a separate building or an outlined grid cell. Clicking any part of its area selects the booth; moving into its footprint still governs open calls and representative controls.

Furniture occupies map cells as well as pixels. Hall plants appear only in cells outside booth footprints, and only visible plants block movement. A furnished booth places its table and chairs wholly inside one grid row; movement is blocked only in that row's columns occupied by the furniture. This leaves open space around the objects for conversation. Keep obstacle coordinates paired with the artwork in both map styles.

For comparing the two map styles, a hitbox control shows every blocked movement cell with a solid red outline and a light red fill. The overlay follows the current plants and furniture, remains visible when switching art styles, and can be hidden without changing movement.

The hall fills the viewport so it feels like a place to explore. Its title and waiting requests float over the map. Selecting a booth opens a floating information panel; the visitor may collapse it to a small label and expand it again. A circular directory control opens the booth list and organizer tools without taking permanent map space. Movement does not need a persistent instruction pill.

Each person remains the same rendered avatar as their grid position changes. Movement interpolates between adjacent positions and briefly animates the avatar's limbs and facing direction. The visitor's own movement begins as soon as a directional key is accepted, then the server confirms or corrects it. Reduced-motion settings remove the animation while preserving the final position.

A held arrow or WASD key keeps moving one tile at a time until release. Each tile takes about 420 milliseconds, including the visual transition, so walking reads as a steady pace instead of a quick jump. Releasing the key stops after the current tile; losing window focus or leaving the fair stops held movement.

The booth panel leads with the booth name and the actions relevant to the selected booth. When an invite-only queue is active, queue actions come before call settings so representatives can invite waiting visitors immediately. The panel has a fixed maximum height within the fair view, a persistent header, and a scrollable content area so every queue action stays reachable even when the roster grows. Keep queue names readable within the panel. Do not show a separate conversation-status card or redundant representative status text and divider lines. A waiting request remains visible when the visitor selects another booth. Organizer and representative controls remain available below the immediate queue actions.

Do not show transient toast notifications for routine actions such as signing in, preparing a meeting link, or inviting visitors. The call action should say “Open video call” and open the meeting directly after Roam checks access to the link. If a call cannot be opened, keep a visible inline error near the relevant controls.

For attendees, label the next action before its controls, including when that action is an invitation. Keep the call and leave-queue controls visually separate in the expanded booth panel.

Use night blue for the frame and calm surfaces, white or soft blue for cards, one violet action color, and small warm accents. Headings can have more weight and personality; supporting text stays plain and easy to scan. The map should feel inhabited through furniture and subtle avatar motion without busy background decoration. Respect reduced-motion preferences.
