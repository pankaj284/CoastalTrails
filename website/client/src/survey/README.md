# Gokarna Coastal Survey & Waypoint GIS Suite

This directory contains the standalone field survey and waypoint collection suite for Gokarna Connect.

## Purpose
Use this module to survey, map, and log secret viewpoints, hidden coves, sacred springs, rocky cliff trails, and ferry landing coordinates with 6-decimal high-precision satellite accuracy.

Once field surveying is complete, you can export your findings as standard **GeoJSON** or **JSON** to batch-integrate directly into the database and consumer application.

---

## Directory Structure
- `surveyTypes.ts`: Full TypeScript definitions for Survey Points, GeoJSON FeatureCollections, Categories, Accessibility, and Tide Conditions.
- `surveyStore.ts`: Local persistence (`localStorage`), GeoJSON converter, and JSON import/export functions.
- `SurveyWorkspacePage.tsx`: Full-featured satellite GIS workbench equipped with:
  - High-res Google Satellite Hybrid tiles.
  - Interactive crosshair coordinate logger.
  - Category tags (Viewpoints, Secret Coves, Rock Trails, Freshwater Springs, Shrines, Cafes, Jetties, Hazards).
  - One-click GeoJSON & JSON export.
  - Instant batch import for resuming field surveys.
- `README.md`: This documentation.

---

## How to Access the Survey Workspace
The survey tool is accessible at the route:
```
http://localhost:3000/survey
```
(Kept segregated from the main public consumer website at `/` and `/trails`).

---

## Field Workflow
1. Open `/survey` on a laptop or field tablet.
2. Click **`+ New Waypoint`** (turns on crosshair survey mode).
3. Tap or click on the exact rock, cliff edge, or beach cove on the satellite imagery.
4. Fill in the field specs:
   - **Name** (e.g. *Rock Point Sunset Ledge*)
   - **Category** (*Viewpoint, Secret Cove, Trailhead, Spring, etc.*)
   - **Elevation** (meters above sea level)
   - **Accessibility** (*Easy walk, Rock scramble, Steep climb, Boat only*)
   - **Tide Condition** (*All tides safe, Low tide only, etc.*)
   - **Field Notes & Secret Tips**
5. Click **Log Waypoint 📌**.

---

## Exporting & Integration
When you are ready to integrate your surveyed points into the main website:
1. Click **`GeoJSON`** or **`JSON`** in the top action bar to download the complete surveyed dataset.
2. Store the file in `website/server/data/surveyed_landmarks.json` or seed it directly into the PostgreSQL / SQLite database.
3. The main map will then render verified surveyed points seamlessly.
