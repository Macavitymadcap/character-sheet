# Epic sheet-0001 

Plan out an epic to implement an mvp for the character sheet app. You are currently in the root of pace-calculator, which you can use as a template for the character sheet app which is located at ../character-sheet relative to pace-calculator. For now we will focus on getting it running locally with sql lite. Deployment to railway and use of postgres will come in the next epic.   

## Roles

Max 10 users with the following roles: 
  - Player: can crud their own character sheet
  - Game Master: can crud all sheets, has access to their own tables for campaign and session info, can send send invites and set password reset
- Admin: purely admin functionality, like invites, password reset, basic reads of data etc.

To begin with we will have one player role (the Lynott sheet), 1 dm and 1 admin.

## Data

- 5e.tools as the source of data, it can be taken as markdown or json from the site.  Create a utility script that can grab data ad needed.
- I will be using only the 2014 rules, all official books but with reprints, such as the artificer class (from Eberron to tasha's) and many of the races, normalising to be the most recent 2014 rules printing, e.g., choosing the Artifcer from tasha's cauldron rather than the Eberron book. 
- Use british english, translating any of the scraped data from american. Also use british english in the codebase as a rule, e.g., --background-colour not --background-color.
- Rather than markdown the data will be stored in the database, with fields for accessing all the relevant static and updatable data for programmatic access e.g., the number of uses for a feature/trait, dice notation for a roll, conditions inflicted etc.
- There will need to be tables for the users, their character sheet, it's constituents, player notes, game master notes etc.

Start with enough rules in the database and functionality to support the Lynott character, a game master and an admin.

## Pages

A sticky header for site wide state and actions:
  - app name
  - menu for login, logout, nav

The sheet page should have a sticky header containing labelled outputs and buttons for:
- character name, race, level
- armour class
- hit points
- initiative
- conditions
- inspiration
- rest
- setting

Beneath the header should be the following tabs, which should be scrollable on the y axis:
  - core (abilities, saves, senses, speed & defence)
- skills, proficiencies, languages & tools
- actions
- spellcasting
- features and traits
- equipment
- background
- notes

There should also be pages for
- login
- logout
- home
- admin 

## Workflow

Begin by creating base architecture, contributing and readme docs then proceed onto each ticket in the epic. Use the equivalents in the pace-calculator app as templates to follow.

The documentation should capture all the relevant choices, interfaces and processes required to create the mvp,   should include high-level diagrams for the base data model, table definitions and their relationships, the basic user flow for mvp, as well as instructions on how to use the repo locally and how it works in the pipeline.

The tickets should include low-level diagrams for any components or services to be created, tables added to the db, user flows being implemented and changes to effected components/services if applicable.

We will work in this flow:
1. You generate the markdown based on my prompt, asking questions for refinement if you have any.
2. I will review the doc. 
3. Depending on the verdict:
  - ok: update any effected documentation if needed, then move onto the next document
  - not ok: repeat 1 - 2 until accepted.

  epics and tickets use the same numbering system, e.g., sheet-0001. As we start with epic 0001, each ticket planned and accepted can increment from there. use this pattern when we move to other epics.
