var fs = require('fs');

function csvParse(csvFile) {
  var csvContents = fs.readFileSync(csvFile, "utf8");
  var lines = csvContents.split("\n").slice(1);

  var data = [];

  for (var i in lines) {
    var cells = lines[i].split(",");
    if (cells.length === 4) {
      data.push({
        firstName: cells[0],
        lastName: cells[1],
        numMonthsSinceContact: cells[2],
        emailAddress: cells[3]
      });
    } else {
      console.error("ERROR: line " + (Number(i) + 2).toString() + " does not have 4 values: " + lines[i])
    }
  }
  return data;
}

var csvData = csvParse("friend_list.csv");

console.dir(csvData);