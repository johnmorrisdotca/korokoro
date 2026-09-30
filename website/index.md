---
layout: home
title: Korokoro
hero:
  name: Korokoro コロコロ
  text: Fair dice, with the odds of every throw
  tagline: A dice roller and a dice notation parser with exact odds. A typed API, a command line, and a tray that runs anywhere.
  actions:
    - theme: brand
      text: Get started
      link: /guide/start
    - theme: alt
      text: Roll some dice
      link: https://johnmorrisdotca.github.io/korokoro/
    - theme: alt
      text: The notation
      link: /guide/notation
features:
  - title: Exact odds
    details: Worked out and never simulated, for every notation it reads, from 2d6 to floor(4d6/2) and a pool of exploding d10.
    link: /guide/odds
  - title: Any dice
    details: Every die from a d2 to a d1000, Fate dice, dice of your own, keep and drop, rerolls, explosions, successes, arithmetic.
    link: /guide/notation
  - title: A tray that is finished
    details: Dice you tap, real dice sounds, history, stats and a link to any roll. For React, Vue, Svelte, Angular, or any page as a web component.
    link: /guide/use
  - title: A command line
    details: koro 2d20kh1+5 in a terminal on Linux, macOS and Windows, with JSON and CSV for other programs.
    link: /guide/cli
  - title: 44 games
    details: The dice of Yahtzee, craps, Risk, chō-han and the rest, each read the way the game reads it.
    link: /guide/games
  - title: Checked by anyone
    details: A seeded roll replays die for die, and a specification and a conformance suite say how, for ports to other languages.
    link: /guide/other-languages
---

<LiveDice notation="2d20kh1+5" open />
