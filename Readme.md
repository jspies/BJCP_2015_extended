### BJCP 2015 Styles JSON

Thanks to https://github.com/SmedbergM/BJCP_2015 for the painstaking copy paste to get the Style Guidelines into machien readable format.

This repository provides a script to translate the XML files to JSON. The files are pregenerated in *files*.

#### Usage

```bash
./xml2json path-to-files
```

#### Options

```
-i, --input, the location of the xml files (required)
-r, --raw, also generate a raw xml to json conversion for each style. (A straight port with no cleanup)
-e, --enhance, adds enhanced statistics for machine comparison
```