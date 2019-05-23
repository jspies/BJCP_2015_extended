#!/usr/bin/env node

const parser    = require("xml2json");
const fs        = require("fs");
const path      = require("path");
const commander = require("commander");
const startI    = 1;
const endI      = 26;

commander.version("0.0.1");
commander
  .option("-r, --raw", "generate raw files as well")
  .option("-i, --input <string>", "location of xml input files")
  .option("-e, --enhance", "add enhanced statistics")
  .parse(process.argv);

if (!commander.input) {
  console.error("no input given");
  process.exit(1);
}

const files  = fs.readdirSync(commander.input);

let enhancements = {};
if (commander.enhance) {
  enhancements = JSON.parse(fs.readFileSync("./enhanced/enhancements.json"));
}

for(let currentFileIndex = startI - 1; currentFileIndex < endI; currentFileIndex++) {
  const xml= fs.readFileSync(`${path.join(commander.input, files[currentFileIndex])}`, "utf8");

  let json = parser.toJson(xml, {
    object: true
  });

  if (commander.raw) {
    fs.writeFileSync(`./files/${json.doc.category.number}_raw.json`, JSON.stringify(json, null, 2));
  }
  
  json = json.doc.category;
  
  let category = {
    name: json.name,
    number: json.number,
    paragraph: json.paragraph
  };
  
  let styles = json.style;
  
  for(let i = 0; i < styles.length; i++) {
    let style =  styles[i];

    if (style.substyle) {
      for (let substyleIndex = 0; substyleIndex < style.substyle.length; substyleIndex++) {
        let substyle = style.substyle[substyleIndex];
        substyle.category = category.number;
        substyle.parent_style_id = style.style_id;
        substyle.tags = substyle.tags.tag;

        substyle.commercial_examples = substyle.commercialexamples.commercial_example;
        if (typeof substyle.commercial_examples[0] === "object") {
          for(let ce = 0; ce < substyle.commercial_examples.length; ce++) {
            substyle.commercial_examples[ce] = substyle.commercial_examples[ce]["$t"];
          }
        }
    
        ["vital_statistics", "mouthfeel", "style_comparison", "characteristic_ingredients", "history", "aroma", "flavor", "appearance", "overall_impression", "comments"].map(function(key) {
          let oldKey = key.replace("_", "");
          if (substyle[oldKey].paragraph) {
            substyle[key] = substyle[oldKey].paragraph;
          } else {
            substyle[key] = substyle[oldKey];
          }
          if (key.includes("_")) {
            delete substyle[oldKey];
          }
        })
        delete substyle.commercialexamples;

        if (enhancements[substyle.parent_style_id]) { 
          substyle.enhancements = enhancements[substyle.parent_style_id][substyle.substyle_name.replace(/\s/g, "_")];
          substyle.enhancements.carbonation_average = (substyle.enhancements.carbonation_low + substyle.enhancements.carbonation_high) / 2;
          substyle.enhancements.body_average = (substyle.enhancements.body_low + substyle.enhancements.body_high) / 2;
        }

        fs.writeFileSync(`./files/${style.style_id}_${style.style_name}_${substyle.substyle_name}.json`.replace(/\s/g, "_"), JSON.stringify(substyle, null, 2));
        
      }
    } else {
      style.category = category.number;
      style.tags = style.tags.tag;
      style.commercial_examples = style.commercialexamples.commercial_example;
      delete style.commercialexamples;
    }

    ["entry_instructions", "vital_statistics", "mouthfeel", "style_comparison", "characteristic_ingredients", "history", "aroma", "flavor", "appearance", "overall_impression", "comments"].map(function(key) {
      let oldKey = key.replace("_", "");
      
      if (style[oldKey]) {
        if (style[oldKey].paragraph) {
          style[key] = style[oldKey].paragraph;
        } else {
          style[key] = style[oldKey];
        }
        if (key.includes("_")) {
          delete style[oldKey];
        }
      }
    })
    
    if (enhancements[style.style_id]) {
      style.enhancements = enhancements[style.style_id];
      style.enhancements.carbonation_average = (style.enhancements.carbonation_low + style.enhancements.carbonation_high) / 2;
      style.enhancements.body_average = (style.enhancements.body_low + style.enhancements.body_high) / 2;
    }
    
    fs.writeFileSync(`./files/${style.style_id}_${style.style_name}.json`.replace(/\s/g, "_"), JSON.stringify(style, null, 2));
  }
}
