# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Family members on an email allowlist (see openspec/specs/family-access). Three situations: cooking in the kitchen (phone or tablet on the counter, messy hands, glancing mid-recipe), browsing and planning what to cook, and contributing their own recipes. Language is Dutch.

## Product Purpose

A private family cookbook that preserves the family's recipes and makes them usable while cooking. Success: relatives cook from it regularly and keep adding to it.

## Positioning

Private to the family (no public sharing, discovery, or ads), built to preserve heritage, with cook-mode usability (scaling, checklists, readable steps) as a first-class feature.

## Operating Context

Mobile and tablet in the kitchen; desktop for browsing and contributing. Sign-in is by emailed one-time code, no accounts or passwords.

## Capabilities and Constraints

- Stack: React Router on Cloudflare Workers (packages/web); D1 for storage (see openspec/specs/recipe-storage), recipe pages read from it, the home page still lists sample data.
- UI language: Dutch.
- Photo/scan handling, and editing workflow are not yet defined.

## Evidence on Hand

Few recipes exist so far. No testimonials, handwritten scans, or photos are available in the repo; future work must not fabricate recipes, family names, or stories.

## Product Principles

1. Cooking use beats browsing polish: the recipe view must work with messy hands at arm's length.
2. Every recipe belongs to someone: attribution and heritage are part of the content.
3. Private by default: nothing implies public sharing.
4. Design for sparse content: a few recipes must feel complete, not empty.

## Accessibility & Inclusion

Mixed ages including older relatives: large readable text, high contrast, no hidden gestures.
