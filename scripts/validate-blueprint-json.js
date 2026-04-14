#!/usr/bin/env node
/**
 * Headless validation for Blueprint3D saved JSON (building / legacy single-floor).
 * Usage: node scripts/validate-blueprint-json.js [file.json]
 *        cat design.blueprint3d | node scripts/validate-blueprint-json.js
 */

const fs = require("fs");
const path = require("path");

function isNum(x) {
  return typeof x === "number" && !isNaN(x);
}

function validateFloorplan(fp, label) {
  const errs = [];
  const L = label || "floorplan";
  if (!fp || typeof fp !== "object") {
    errs.push(L + " must be an object");
    return errs;
  }
  if (!fp.corners || typeof fp.corners !== "object") {
    errs.push(L + ".corners must be an object");
  }
  if (!Array.isArray(fp.walls)) {
    errs.push(L + ".walls must be an array");
  } else {
    fp.walls.forEach((w, i) => {
      if (!w || typeof w !== "object") errs.push(L + ".walls[" + i + "] invalid");
      else {
        if (typeof w.corner1 !== "string" || typeof w.corner2 !== "string") {
          errs.push(L + ".walls[" + i + "] needs string corner1/corner2");
        }
      }
    });
  }
  return errs;
}

function validateItem(it, i, prefix) {
  const errs = [];
  const p = (prefix || "items") + "[" + i + "]";
  if (!it || typeof it !== "object") {
    errs.push(p + " must be an object");
    return errs;
  }
  if (typeof it.item_name !== "string") errs.push(p + ".item_name should be a string");
  if (!isNum(it.item_type)) errs.push(p + ".item_type must be a number");
  if (it.model_url != null && typeof it.model_url !== "string") errs.push(p + ".model_url must be a string if present");
  ["xpos", "ypos", "zpos", "rotation", "scale_x", "scale_y", "scale_z"].forEach((k) => {
    if (it[k] != null && !isNum(it[k])) errs.push(p + "." + k + " must be a number");
  });
  return errs;
}

function validateBuilding(data) {
  const errs = [];
  if (!data || typeof data !== "object") {
    return ["root must be a JSON object"];
  }

  if (Array.isArray(data.floors)) {
    if (data.floors.length < 1) errs.push("floors array must not be empty");
    data.floors.forEach((floor, fi) => {
      const p = "floors[" + fi + "]";
      if (!floor || typeof floor !== "object") {
        errs.push(p + " invalid");
        return;
      }
      if (floor.name != null && typeof floor.name !== "string") errs.push(p + ".name must be a string");
      if (!isNum(floor.level)) errs.push(p + ".level must be a number");
      if (floor.height != null && !isNum(floor.height)) errs.push(p + ".height must be a number if set");
      errs.push.apply(errs, validateFloorplan(floor.floorplan, p + ".floorplan"));
      if (!Array.isArray(floor.items)) errs.push(p + ".items must be an array");
      else floor.items.forEach((it, j) => errs.push.apply(errs, validateItem(it, j, p + ".items")));
    });
    return errs;
  }

  if (data.floorplan) {
    errs.push.apply(errs, validateFloorplan(data.floorplan, "floorplan"));
    if (!Array.isArray(data.items)) errs.push("items must be an array for legacy format");
    else data.items.forEach((it, j) => errs.push.apply(errs, validateItem(it, j, "items")));
    return errs;
  }

  errs.push('Expected "floors" array or legacy "floorplan" + "items"');
  return errs;
}

function main() {
  const arg = process.argv[2];
  let raw;
  if (arg && arg !== "-") {
    const filePath = path.resolve(process.cwd(), arg);
    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      process.exit(2);
    }
    raw = fs.readFileSync(filePath, "utf8");
  } else {
    raw = fs.readFileSync(0, "utf8");
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error("Invalid JSON:", e.message);
    process.exit(1);
  }

  const errs = validateBuilding(data);
  if (errs.length) {
    console.error("Validation failed:");
    errs.forEach(function (e) {
      console.error(" -", e);
    });
    process.exit(1);
  }
  console.log("OK: blueprint JSON is structurally valid.");
  process.exit(0);
}

module.exports = { validateBuilding };

if (require.main === module) {
  main();
}
