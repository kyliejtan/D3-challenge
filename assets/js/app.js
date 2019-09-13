////////////////////////////////////////////////////////////////////////////////
// This section sets up the basic characteristics of the svg window and chart //
// area.                                                                      //
////////////////////////////////////////////////////////////////////////////////
// Defining the svg window dimensions
let svgWidth = 960;
let svgHeight = 600;
// Defining the margins between the svg window and chart area
let margin = {
  top: 20,
  right: 20,
  bottom: 100,
  left:100
}
// Calculating the dimensions of the svg chart area
let width = svgWidth - margin.left - margin.right;
let height = svgHeight - margin.top - margin.bottom;
// Appending the svg window to the #scatter div of index.html
// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
let svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);
// Append an SVG group
let chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial x-axis parameter
let chosenXAxis = "poverty";
let chosenYAxis = "healthcare"
////////////////////////////////////////////////////////////////////////////////
// This section is where the functions that will help build the scatter plot  //
// are defined.                                                               //
////////////////////////////////////////////////////////////////////////////////
// function used for updating x-scale let  upon click on axis label
function capitalizeFirstLetter(str) {
  if (str.charAt(0) === "(") {
    return "(" + str.charAt(1).toUpperCase() + str.slice(2)}
  else {
    return str.charAt(0).toUpperCase() + str.slice(1)}
};
// Initializing a function to format str data into title case
function titleCase(str) {
    return str.split(" ").map(x => capitalizeFirstLetter(x)).join(" ")
};
//
function xScale(healthData, chosenXAxis) {
  // create scales
  let  xLinearScale = d3.scaleLinear()
    .domain([d3.min(healthData, d => d[chosenXAxis]) * 0.8,
      d3.max(healthData, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);

  return xLinearScale;

}
//
function yScale(healthData, chosenYAxis) {
  // create scales
  let  yLinearScale = d3.scaleLinear()
    .domain([d3.max(healthData, d => d[chosenYAxis]) * 1.2,
      d3.min(healthData, d => d[chosenYAxis]) * 0.8
    ])
    .range([0, height]);

  return yLinearScale;
}
// function used for updating xAxis let  upon click on axis label
function renderXAxe(newXScale, xAxis) {
  let bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}
//
function renderYAxe(newYScale, yAxis) {
  let leftAxis = d3.axisLeft(newYScale);

  yAxis.transition()
    .duration(1000)
    .call(leftAxis);

  return yAxis;
}
//
function renderXCircles(circlesGroup, newXScale, chosenXaxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));

  return circlesGroup;
}
//
function renderYCircles(circlesGroup, newYScale, chosenYaxis) {
  circlesGroup.transition()
    .duration(1000)
    .attr("cy", d => newYScale(d[chosenYAxis]));

  return circlesGroup;
}
// Appending text inside each circle
function renderPointLabels(circleLabels, chosenXAxis, chosenYAxis, xLinearScale, yLinearScale) {

  circleLabels.transition()
    .duration(1000)
    .attr("x", function(d) {
      return xLinearScale(d[chosenXAxis]);
    })
    .attr("y", function(d) {
      return yLinearScale(d[chosenYAxis]);
    })
    .text(function(d) {
      return d.abbr;
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "10px")
    .attr("text-anchor", "middle")
    .attr("fill", "white");

  return circleLabels
};
// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {

  label = `${chosenYAxis + "vs." + chosenXAxis}`

  let toolTip = d3.tip()
    .attr("class", "tooltip")
    .html(function(d) {
      return (`<h6>${titleCase(chosenYAxis) + " vs. " + titleCase(chosenXAxis)}</h6><hr>
        <h6>${d.state}</h6>
        ${titleCase(chosenYAxis) + ": " + d[chosenYAxis]}<br>
        ${titleCase(chosenXAxis) + ": " + d[chosenXAxis]}`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(data) {
    toolTip.show(data, this);
    d3.select(this)
      .attr("fill", "pink");

  })
    // onmouseout event
    .on("mouseout", function(data, index) {
      toolTip.hide(data);
      d3.select(this)
        .attr("fill", "lightblue");
    });

  return circlesGroup;
}
////////////////////////////////////////////////////////////////////////////////
// This section is where the csv data is read in and passed to the chart-     //
// building functions, the results of which are then appended to the svg chart//
////////////////////////////////////////////////////////////////////////////////
// ===========================================================================//
// Import data from the data.csv file
d3.csv("assets/data/data.csv", function(error, healthData) {
  if (error) throw error;
  // Parsing the string data in healthData into integers
  healthData.forEach(function(data) {
    data.id = +data.id;
    data.state = data.state;
    data.abbr = data.abbr;
    data.poverty = +data.poverty;
    data.povertyMoe = +data.povertyMoe;
    data.age = +data.age;
    data.ageMoe = +data.ageMoe;
    data.income = +data.income;
    data.incomeMoe = +data.incomeMoe;
    data.healthcare = +data.healthcare;
    data.healthcareLow = +data.healthcareLow;
    data.healthcareHigh = +data.healthcareHigh;
    data.obesity = +data.obesity;
    data.obesityLow = +data.obesityLow;
    data.obesityHigh = +data.obesityHigh;
    data.smokes = +data.smokes;
    data.smokesLow = +data.smokesLow;
    data.smokesHigh = +data.smokesHigh;
  });
  // Initializing a variable with the the default linear scale for the x axis
  let xLinearScale = d3.scaleLinear()
    .domain(d3.extent(healthData, d => d.poverty))
    .range([0, width]);

  // Initializing a variable with the the default linear scale for the y axis
  let yLinearScale = d3.scaleLinear()
    .domain([d3.max(healthData, d => d[chosenYAxis]) * 1.2,
      d3.min(healthData, d => d[chosenYAxis]) * 0.8
    ])
    .range([0, height]);

  // Initializing variables with the default x and y axes
  let bottomAxis = d3.axisBottom(xLinearScale);
  let leftAxis = d3.axisLeft(yLinearScale);

  // Appending the x-axis to the svg chart area
  let xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // Appending the x-axis to the svg chart area
  let yAxis = chartGroup.append("g")
    .classed("y-axis", true)
    .call(leftAxis);

  // Initializing a variable with the default scatter plot points that are
  // appended to the svg chart area
  let circlesGroup = chartGroup.selectAll("circle")
    .data(healthData)
    .enter()
    .append("circle")
    .attr("cx", d => xLinearScale(d.poverty))
    .attr("cy", d => yLinearScale(d.healthcare))
    .attr("r", 20)
    .attr("fill", "lightblue")
    .attr("opacity", "1");

  // Appending text to each scatter plot point
  let circleLabels = chartGroup.selectAll(null)
    .data(healthData)
    .enter()
    .append("text");

  // Defining the values and default position of the text that was appended to
  // each scatter plot point
  circleLabels
    .attr("x", function(d) {
      return xLinearScale(d.poverty);
    })
    .attr("y", function(d) {
      return yLinearScale(d.healthcare);
    })
    .text(function(d) {
      return d.abbr;
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "10px")
    .attr("text-anchor", "middle")
    .attr("fill", "white");

  // Initializing a variable with an area for x-axis labels that has been
  // appended to the svg chart area
  let xlabelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  // The following three variables store the properties of each x-axis label
  let povertyLabel = xlabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty")
    .classed("active", true)
    .text("In Poverty (%)");

  let ageLabel = xlabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "age")
    .classed("inactive", true)
    .text("Age (Median)");

  let incomeLabel = xlabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 60)
    .attr("value", "income")
    .classed("inactive", true)
    .text("Household Income (Median)");

  // Initializing a variable with an area for y-axis labels that has been
  // appended to the svg chart area
  let  ylabelsGroup = chartGroup.append("g")
    .attr("transform", `translate(-50, ${height / 2})`);

  // The following three variables store the properties of each x-axis label
  let healthcareLabel = ylabelsGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0)
    .attr("x", 0)
    .attr("dy", "1em")
    .attr("value", "healthcare")
    .classed("active", true)
    .text("Lacks Healthcare (%)");

  let smokesLabel = ylabelsGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -20)
    .attr("x", 0)
    .attr("dy", "1em")
    .attr("value", "smokes")
    .classed("inactive", true)
    .text("Smokes (%)");

  let obeseLabel = ylabelsGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", 0)
    .attr("dy", "1em")
    .attr("value", "obesity")
    .classed("inactive", true)
    .text("Obese (%)");

  // Updating the toolTip for the default scatter plot points
  circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

  //////////////////////////////////////////////////////////////////////////////
  // This section is where on-click events to any of the axis labels are      //
  // listened for and where the properties of the clicked axis label are      //
  // passed to the each of the previously defined fucntions so that the       //
  // scatter plot can be updated with the data the user has selected.         //
  //////////////////////////////////////////////////////////////////////////////
  xlabelsGroup.selectAll("text")
    .on("click", function() {
      // Retrieving the xValue of the clicked x-axis label
      let xValue = d3.select(this).attr("value");

      // Passing the new chosenXAxis to the chart building functions
      if (xValue !== chosenXAxis) {
        chosenXAxis = xValue;
        xLinearScale = xScale(healthData, chosenXAxis);
        xAxis = renderXAxe(xLinearScale, xAxis);
        circlesGroup = renderXCircles(circlesGroup, xLinearScale, chosenXAxis);
        circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);
        circleLabels = renderPointLabels(circleLabels, chosenXAxis, chosenYAxis,
          xLinearScale, yLinearScale);
        // Updating the active or inactive status of each x-axis label
        if (chosenXAxis === "poverty") {
          povertyLabel
            .classed("active", true)
            .classed("inactive", false);
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
        }
        else if (chosenXAxis === "age") {
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          ageLabel
            .classed("active", true)
            .classed("inactive", false);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
        }
        else {
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });

    ylabelsGroup.selectAll("text")
      .on("click", function() {
        // Retrieving the xValue of the clicked y-axis label
        let  yValue = d3.select(this).attr("value");

        // Passing the new chosenXAxis to the chart building functions
        if (yValue !== chosenYAxis) {
          chosenYAxis = yValue;
          yLinearScale = yScale(healthData, chosenYAxis);
          yAxis = renderYAxe(yLinearScale, yAxis);
          circlesGroup = renderYCircles(circlesGroup, yLinearScale, chosenYAxis);
          circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);
          circleLabels = renderPointLabels(circleLabels, chosenXAxis, chosenYAxis,
            xLinearScale, yLinearScale);
          // Updating the active or inactive status of each y-axis label
          if (chosenYAxis === "healthcare") {
            healthcareLabel
              .classed("active", true)
              .classed("inactive", false);
            smokesLabel
              .classed("active", false)
              .classed("inactive", true);
            obeseLabel
              .classed("active", false)
              .classed("inactive", true);
          }
          else if (chosenYAxis === "smokes") {
            healthcareLabel
              .classed("active", false)
              .classed("inactive", true);
            smokesLabel
              .classed("active", true)
              .classed("inactive", false);
            obeseLabel
              .classed("active", false)
              .classed("inactive", true);
          }
          else {
            healthcareLabel
              .classed("active", false)
              .classed("inactive", true);
            smokesLabel
              .classed("active", false)
              .classed("inactive", true);
            obeseLabel
              .classed("active", true)
              .classed("inactive", false);
          }
        }
      });
});
