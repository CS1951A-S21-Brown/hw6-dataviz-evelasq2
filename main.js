// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = { top: 40, right: 100, bottom: 40, left: 220 };

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = MAX_WIDTH / 2 - 10,
    graph_1_height = 250;

let g1_range_width = graph_1_width - margin.left - margin.right;
let g1_range_height = graph_1_height - margin.top - margin.bottom;

const graph1 = d3
    .select('#graph1')
    .append('svg')
    .attr('width', graph_1_width)
    .attr('height', graph_1_height)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

const g1x = d3.scaleLinear().range([0, g1_range_width]).domain([0, 90]);
const g1y = d3.scaleBand().range([0, g1_range_height]).padding(0.2);
const salesRef = graph1.append('g');
const titlesRef = graph1.append('g').attr('id', 'titles_label');

graph1
    .append('text')
    .attr(
        'transform',
        `translate(${graph_1_width / 6},
        ${graph_1_height - 60})`
    )
    .text('Total Sales (millions)');

let g1Header = graph1
    .append('text')
    .attr('transform', `translate(${g1_range_width / 2}, ${-20})`)
    .style('text-anchor', 'middle')
    .style('font-size', 15);

let g1color = d3.scaleOrdinal().range(d3.quantize(d3.interpolateHcl('#ee323a', '#8d6899'), 10));

const updateData = (year) => {
    d3.csv('../data/video_games.csv').then(function (data) {
        data.forEach(function (row) {
            row.Global_Sales = parseFloat(row.Global_Sales);
        });

        let g1data = data.filter(function (a) {
            return parseInt(a.Year) === year;
        });

        g1data = g1data.sort((a, b) => b.Global_Sales - a.Global_Sales);
        g1data = g1data.slice(0, 10);

        g1y.domain(g1data.map((d) => d.Name));
        g1color.domain(g1data.map((d) => d.Name));

        titlesRef.call(d3.axisLeft(g1y).tickSize(0).tickPadding(10));

        const bars = graph1.selectAll('.bar').data(g1data);
        bars.enter()
            .append('rect')
            .merge(bars)
            .attr('class', 'bar')
            .attr('fill', (d) => g1color(d.Name))
            .attr('y', (d) => g1y(d.Name))
            .attr('x', 2)
            .attr('height', g1y.bandwidth())
            .transition()
            .duration(1000)
            .attr('width', (d) => g1x(d.Global_Sales));

        const sales = salesRef.selectAll('text').data(g1data);
        sales
            .enter()
            .append('text')
            .merge(sales)
            .transition()
            .duration(1000)
            .attr('x', (d) => g1x(d.Global_Sales) + 5)
            .attr('y', (d) => g1y(d.Name) + g1y.bandwidth() / 2 + 4)
            .text((d) => d.Global_Sales + 'mm');

        g1Header.text(`Top ${g1data.length} Highest-Selling Games of ${year}`);
        bars.exit().remove();
        sales.exit().remove();
    });
};
const slider = document.getElementById('graph1Range');

const update = () => {
    updateData(parseInt(slider.value));
};

slider.addEventListener('input', update);
update(2006);

// GRAPH 2
let graph_2_width = MAX_WIDTH / 2 - 10,
    graph_2_height = 275;

let g2_range_width = graph_2_width - margin.left - margin.right;
let g2_range_height = graph_2_height - margin.top - margin.bottom;

let g2radius = Math.min(g2_range_height, g2_range_width) / 2;
const graph2 = d3
    .select('#graph2')
    .append('svg')
    .attr('width', graph_2_width)
    .attr('height', graph_2_height)
    .append('g')
    .attr('transform', `translate(${graph_2_width / 2}, ${graph_2_height / 2})`);
const g2color = d3.scaleOrdinal().range(d3.schemeDark2);

let tooltip = d3
    .select('#graph2') // HINT: div id for div containing scatterplot
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

let g2Header = graph2
    .append('text')
    .attr('transform', `translate(${g1_range_width / 2}, ${-20})`)
    .style('text-anchor', 'middle')
    .style('font-size', 15);

const updatePie = (region) => {
    d3.csv('../data/video_games.csv').then(function (data) {
        data.forEach(function (row) {
            row.Global_Sales = parseFloat(row.Global_Sales);
        });

        let g2data = d3
            .nest()
            .key(function (d) {
                return d.Genre;
            })
            .rollup(function (v) {
                return {
                    sales: d3.sum(v, function (d) {
                        return d[region];
                    }),
                    // salesEU: d3.sum(v, function (d) {
                    //     return d.EU_Sales;
                    // }),
                    // salesJP: d3.sum(v, function (d) {
                    //     return d.JP_Sales;
                    // }),
                };
            })
            .entries(data);

        g2color.domain(g2data.map((d) => d.key));

        const pie = d3
            .pie()
            .value(function (d) {
                return d.value.sales;
            })
            .sort(function (a, b) {
                return d3.ascending(a.key, b.key);
            }); // This make sure that group order remains the same in the pie chart
        const data_ready = pie(g2data);
        const slices = graph2.selectAll('path').data(data_ready);

        let mouseover = function (d) {
            const sls = Number.parseFloat(d.data.value.sales).toPrecision(4);
            let html = `${d.data.key}<br/>
                        Total Sales: ${sls}mm</span>`; // HINT: Display the song here

            // Show the tooltip and set the position relative to the event X and Y location
            tooltip
                .html(html)
                .style('left', `${d3.event.pageX - 220}px`)
                .style('top', `${d3.event.pageY - 30}px`)
                .transition()
                .duration(200)
                .style('opacity', 0.9);
        };

        // Mouseout function to hide the tool on exit
        let mouseout = function (d) {
            // Set opacity back to 0 to hide
            tooltip.transition().duration(200).style('opacity', 0);
        };

        slices
            .enter()
            .append('path')
            .merge(slices)
            .transition()
            .duration(1000)
            .attr('d', d3.arc().innerRadius(0).outerRadius(g2radius))
            .attr('fill', function (d) {
                return g2color(d.data.key);
            })
            .attr('stroke', 'white')
            .style('stroke-width', '2px')
            .style('opacity', 1);

        slices.on('mouseover', mouseover).on('mouseout', mouseout);

        slices.exit().remove();

        g2Header.text(`Sales per Genre (${region.slice(0, 2)})`);
    });
};

updatePie('NA_Sales');
updatePie('JP_Sales');

// GRAPH 3

let graph_3_width = MAX_WIDTH / 2,
    graph_3_height = 250;

let g3_range_width = graph_3_width - margin.left - margin.right;
let g3_range_height = graph_3_height - margin.top - margin.bottom;

const graph3 = d3
    .select('#graph3')
    .append('svg')
    .attr('width', graph_3_width)
    .attr('height', graph_3_height)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

const g3x = d3.scaleLinear().range([0, g1_range_width]).domain([0, 500]);
const g3y = d3.scaleBand().range([0, g1_range_height]).padding(0.2);
const g3salesRef = graph3.append('g');
const publisherRef = graph3.append('g').attr('id', 'titles_label');

graph3
    .append('text')
    .attr(
        'transform',
        `translate(${graph_3_width / 6},
        ${graph_3_height - 60})`
    )
    .text('Total Sales (millions)');

let g3Header = graph3
    .append('text')
    .attr('transform', `translate(${g3_range_width / 2}, ${-20})`)
    .style('text-anchor', 'middle')
    .style('font-size', 15);

let g3color = d3.scaleOrdinal().range(d3.quantize(d3.interpolateHcl('#ee323a', '#8d6899'), 10));

const updateDataG3 = (genre) => {
    d3.csv('../data/video_games.csv').then(function (data) {
        data.forEach(function (row) {
            row.Global_Sales = parseFloat(row.Global_Sales);
        });

        let g3data = data.filter(function (a) {
            return a.Genre === genre;
        });

        g3data = d3
            .nest()
            .key(function (d) {
                return d.Publisher;
            })
            .rollup(function (v) {
                return {
                    sales: d3.sum(v, function (d) {
                        return d.Global_Sales;
                    }),
                };
            })
            .entries(g3data);

        g3data = g3data.sort((a, b) => b.value.sales - a.value.sales);
        g3data = g3data.slice(0, 10);

        g3y.domain(g3data.map((d) => d.key));
        // g3x.domain([0, d3.max(g3data, (d) => d.value.sales)]);
        g3color.domain(g3data.map((d) => d.key));

        publisherRef.call(d3.axisLeft(g3y).tickSize(0).tickPadding(10));

        // graph1.append('g').attr('class', '.yaxis').call(d3.axisLeft(g1y));
        // graph1.append('g').attr('transform', `translate(0, ${g1_range_height})`).call(d3.axisBottom(g1x));

        // graph1t = d3.select('#graph1').transition();
        // graph1t.select('.yaxis').duration(750).call(g1y);

        const bars = graph3.selectAll('.bar').data(g3data);
        bars.enter()
            .append('rect')
            .merge(bars)
            .attr('class', 'bar')
            .attr('fill', (d) => g3color(d.key))
            .attr('y', (d) => g3y(d.key))
            .attr('x', 2)
            .attr('height', g3y.bandwidth())
            .transition()
            .duration(1000)
            .attr('width', (d) => g3x(d.value.sales));

        const sales = g3salesRef.selectAll('text').data(g3data);
        sales
            .enter()
            .append('text')
            .merge(sales)
            .transition()
            .duration(1000)
            .attr('x', (d) => g3x(d.value.sales) + 5)
            .attr('y', (d) => g3y(d.key) + g3y.bandwidth() / 2 + 4)
            .text((d) => Number.parseFloat(d.value.sales).toPrecision(4) + 'mm');

        g3Header.text(`Top ${genre} Game Publishers`);
        bars.exit().remove();
        sales.exit().remove();
    });
};

updateDataG3('Action');
