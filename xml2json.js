#!/usr/bin/env node

const parser    = require("xml2json");
const fs        = require("fs");
const path      = require("path");
const commander = require("commander");
const DIR       = "../../XML/BJCP_2015/xml/";
const startI    = 1;
const endI      = 26;

const files  = fs.readdirSync(DIR);

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

for(let currentFileIndex = startI - 1; currentFileIndex < endI; currentFileIndex++) {
  const xml= fs.readFileSync(`${path.join(commander.input || DIR, files[currentFileIndex])}`, "utf8");

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
        substyle.style = style.style_id;
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

        fs.writeFileSync(`./files/${style.style_id}_${style.style_name}_${substyle.substyle_name}.json`, JSON.stringify(substyle, null, 2));
        
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
    
    fs.writeFileSync(`./files/${style.style_id}_${style.style_name}.json`, JSON.stringify(style, null, 2));
  }
}
