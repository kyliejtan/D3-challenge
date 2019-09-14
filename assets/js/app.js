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
};
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
let chosenYAxis = "healthcare";
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
// Initializing a function to scale the x-axis
function xScale(healthData, chosenXAxis) {
  // create scales
  let  xLinearScale = d3.scaleLinear()
    .domain([d3.min(healthData, d => d[chosenXAxis]) * 0.95,
      d3.max(healthData, d => d[chosenXAxis])
    ])
    .range([0, width]);

  return xLinearScale;
};
// Initializing a function to scale the y-axis
function yScale(healthData, chosenYAxis) {
  // create scales
  let  yLinearScale = d3.scaleLinear()
    .domain([d3.min(healthData, d => d[chosenYAxis]) * 0.80,
      d3.max(healthData, d => d[chosenYAxis]) * 1.02
    ])
    .range([height, 0]);

  return yLinearScale;
};
// Initializing a function that will re-scale the x-axis when a new dataset is
// selected
function renderXAxe(newXScale, xAxis) {
  let bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
};
// Initializing a function that will re-scale the y-axis when a new dataset is
// selected
function renderYAxe(newYScale, yAxis) {
  let leftAxis = d3.axisLeft(newYScale);

  yAxis.transition()
    .duration(1000)
    .call(leftAxis);

  return yAxis;
};
// Initializing a function that render new scatter plot points when a new
// x-axis is selected
function renderXCircles(circlesGroup, newXScale, chosenXaxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));

  return circlesGroup;
};
// Initializing a function that render new scatter plot points when a new
// y-axis is selected
function renderYCircles(circlesGroup, newYScale, chosenYaxis) {
  circlesGroup.transition()
    .duration(1000)
    .attr("cy", d => newYScale(d[chosenYAxis]));

  return circlesGroup;
};
// Initializing a function that render new scatter plot points labels when
// a new axis is selected
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

  return circleLabels;
};
// Initializing a function that will update the circles group with new tooltips
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

  });
    // onmouseout event
    circlesGroup.on("mouseout", function(data, index) {
      toolTip.hide(data);
      d3.select(this)
        .attr("fill", "lightblue")
    });

  return circlesGroup;
};
// Initializing a function that perform a least squares regression on the plotted
// scatter plot
function linearRegression(x, y){
  let lr = {};
  let n = y.length;
  let sum_x = 0;
  let sum_y = 0;
  let sum_xy = 0;
  let sum_xx = 0;
  let sum_yy = 0;

  for (let i = 0; i < y.length; i++) {

      sum_x += x[i];
      sum_y += y[i];
      sum_xy += (x[i]*y[i]);
      sum_xx += (x[i]*x[i]);
      sum_yy += (y[i]*y[i]);
  };

  lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
  lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
  lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)
    *(n*sum_yy-sum_y*sum_y)),2);

  return lr;
};
// Initializing a function that will return the parameters for plotting a line
// of best fit based on the previously performed least squares regression
function regressionLineYPoints(dataset, chosenXAxis, chosenYAxis) {

  let xArray = dataset.map(data => data[chosenXAxis]);
  let yArray = dataset.map(data => data[chosenYAxis]);
  let x = dataset.map(data => data[chosenXAxis]);
  let regressionLineStats = linearRegression(xArray, yArray);
  let m = regressionLineStats.slope;
  let b = regressionLineStats.intercept;
  let r2 = regressionLineStats.r2;
  let yPoints;
  let sortedXArray;
  if (m > 0) {
    yPoints = x.map(point => m * point + b).sort((a, b) => a - b);
    sortedXArray = x.sort((a, b) => a - b);
  }
  else if (m < 0) {
    yPoints = x.map(point => m * point + b).sort((a, b) => b - a);
    sortedXArray = x.sort((b, a) => b - a);
  };

  let regressionLineArray = []

  for (let i = 0; i < xArray.length; i++) {
    regressionLineArray.push({
      x: sortedXArray[i],
      y: yPoints[i]
    });
  };
  // Calculating correction constants to be used to scale the line of best fit
  // to the scale currently defined for the chartGroup
  let yMaxConst = d3.max(yArray) / d3.max(yPoints);
  let yMinConst = d3.min(yArray) / d3.min(yPoints);

  // Calculating the scale for the line of best fit
  let xdata = d3.scaleLinear()
      .domain([d3.min(regressionLineArray, data => data.x) ,
        d3.max(regressionLineArray, data => data.x)])
      .range([0, width]);

  // Calculating the scale for the line of best fit adjusted to match the
  // the scale currently defined for the chartGroup
  let ydata = d3.scaleLinear()
    .domain([d3.max(regressionLineArray, data => data.y) * yMaxConst * 1.02,
      d3.min(regressionLineArray, data => data.y) * yMinConst * 0.80])
    .range([0, height]);

  // Initializing a variable with the x and y coordinates of the line of best fit
  let drawLine = d3.line()
    .x(data => xdata(data.x))
    .y(data => ydata(data.y));

  // Initializing a variable with the line data for the line of best fit
  let lineData = drawLine(regressionLineArray);

  return [lineData, m, b, r2];
};
// Initializing a function that will render a new line of best fit when a new
// axis is selected
function renderLineGroup(lineGroup, lineData) {
  lineGroup.transition()
    .duration(1000)
    .attr("d", d => lineData);

  return lineGroup;
};
// Initializing a cuntion that will render new text displaying the resultant
// equation for the line of best fit and r^2 value when a new axis is selected
function renderText(equationText) {
  equationText.transition()
    .duration(1000)
    .html(`y = ${regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[1]}x +
    ${regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[2]}`);

  return equationText;
};
// Initializing a function that will render a new paragraph analyzing the
// correlation between the two selected datasets when a new axis is selected
function renderParagraph(chosenXAxis, chosenYAxis) {
  let paragraph;

  if (chosenXAxis === "poverty" && chosenYAxis === "healthcare") {
    paragraph = "Based on the r-squared value derived from the linear regression\
    of the plotted data for the percentage of people who lack healthcare as a\
    function of the percentage of people in poverty, there appears to be a mild\
    correlation between the two quantities."
  }
  else if (chosenXAxis === "poverty" && chosenYAxis === "smokes") {
    paragraph = "Based on the r-squared value derived from the linear regression\
    of the plotted data for the percentage of people who smoke\
    as a function of the percentage of people in poverty, there appears\
    to be a mild correlation between the two quantities."
  }
  else if (chosenXAxis === "poverty" && chosenYAxis === "obesity") {
    paragraph = "Based on the r-squared value derived from the linear regression\
    of the plotted data for the percentage of people who are obese\
    as a function of the percentage of people in poverty, there appears\
    to be a mild correlation between the two quantities."
  }
  else if (chosenXAxis === "age" && chosenYAxis === "healthcare") {
    paragraph = "Based on the r-squared value derived from the linear regression\
    of the plotted data for the percentage of people who lack healthcare\
    as a function of median age, there appears\
    to be a weak correlation between the two quantities."
  }
  else if (chosenXAxis === "age" && chosenYAxis === "smokes") {
    paragraph = "Based on the r-squared value derived from the linear regression\
    of the plotted data for the percentage of people who smoke\
    as a function of median age, there appears\
    to be very weak correlation between the two quantities."
  }
  else if (chosenXAxis === "age" && chosenYAxis === "obesity") {
    paragraph = "Based on the r-squared value derived from the linear regression\
    of the plotted data for the percentage of people who are obese\
    as a function of median age, there appears\
    to be very weak correlation between the two quantities."
  }
  else if (chosenXAxis === "income" && chosenYAxis === "healthcare") {
    paragraph = "Based on the r-squared value derived from the linear regression\
    of the plotted data for the percentage of people who lack healthcare\
    as a function of median household income, there appears\
    to be a mild correlation between the two quantities."
  }
  else if (chosenXAxis === "income" && chosenYAxis === "smokes") {
    paragraph = "Based on the r-squared value derived from the linear regression\
    of the plotted data for the percentage of people who smoke\
    as a function of median household income, there appears\
    to be a moderate correlation between the two quantities."
  }
  else if (chosenXAxis === "income" && chosenYAxis === "obesity") {
    paragraph = "Based on the r-squared value derived from the linear regression\
    of the plotted data for the percentage of people who are obese\
    as a function of median household income, there appears\
    to be a moderate correlation between the two quantities."
  };
  return paragraph
};
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
    .domain([d3.min(healthData, d => d.poverty) * 0.95,
      d3.max(healthData, d => d.poverty)
    ])
    .range([0, width]);

  // Initializing a variable with the the default linear scale for the y axis
  let yLinearScale = d3.scaleLinear()
    .domain([d3.min(healthData, d => d.healthcare) * 0.80,
      d3.max(healthData, d => d.healthcare) * 1.02
    ])
    .range([height, 0]);

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

  // Append an SVG path and plot its points using the line function
  let lineGroup = chartGroup
    .append("path")
    .attr("d", regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[0])
    .classed("line", true);

  //
  let textGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height - 50})`);

  // The following two variables store the properties of each text
  let equationText = textGroup.append("text")
    .attr("x", 50)
    .attr("y", 15)
    .text(`y = ${regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[1]}x +
    ${regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[2]}`);

  let r2Text = textGroup.append("text")
    .attr("x", 50)
    .attr("y", 40)
    .text(`R^2 = ${regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[3]}`);
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
        lineData = regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[0];
        lineGroup = renderLineGroup (lineGroup, lineData);
        equationText.text(`y = ${regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[1]}x +
        ${regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[2]}`);
        r2Text.text(`R^2 = ${regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[3]}`);
        d3.select("p").text(renderParagraph(chosenXAxis, chosenYAxis));
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
        };
      };
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
        lineData = regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[0]
        lineGroup = renderLineGroup (lineGroup, lineData);
        equationText.text(`y = ${regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[1]}x +
        ${regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[2]}`);
        r2Text.text(`R^2 = ${regressionLineYPoints(healthData, chosenXAxis, chosenYAxis)[3]}`);
        d3.select("p").text(renderParagraph(chosenXAxis, chosenYAxis));
        // lineGroup = renderLineGroup (lineGroup, healthData, chosenXAxis, chosenYAxis)
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
