// Along with cited sources, used ChatGPT to help with bugfixing, syntax explanations, and implementing the sankey graph and calculating the phi-correlation
// For Homework 3, additionally used ChatGPT to design the added interactivity

const width = window.innerWidth;
const height = window.innerHeight;

let barLeft = 0, barTop = 0;
let barMargin = {top: 30, right: 30, bottom: 30, left: 60},
    barWidth = 400 - barMargin.left - barMargin.right,
    barHeight = 350 - barMargin.left - barMargin.right;

let sankLeft = barWidth + 200, sankTop = 30;
let sankMargin = {top: 10, right: 30, bottom: 30, left: 60},
    sankWidth = 800 - sankMargin.left - sankMargin.right,
    sankHeight = 700 - sankMargin.left - sankMargin.right;

let heatLeft = 0, heatTop = barHeight + 100;
let heatMargin = {top: 30, right: 30, bottom: 30, left: 60},
    heatWidth = 400 - heatMargin.left - heatMargin.right,
    heatHeight = 350 - heatMargin.left - heatMargin.right;


d3.csv("studentmentalhealth.csv", d3.autoType).then(data =>{
    let conditionsGender = [
        {condition: "Depression", gender: "Male", count: 0},
        {condition: "Depression", gender: "Female", count: 0},
        {condition: "Anxiety", gender: "Male", count: 0},
        {condition: "Anxiety", gender: "Female", count: 0},
        {condition: "Panic Attacks", gender: "Male", count: 0},
        {condition: "Panic Attacks", gender: "Female", count: 0}
    ];
    console.log("data", data)
    /*let dep_count = 0;
    let dep_gpa = 0;
    let anx_count = 0;
    let anx_gpa = 0;
    let pan_count = 0;
    let pan_gpa = 0;*/
    data.forEach(d => {
        //console.log(d)
        
        //console.log(d.depression, d.anxiety, d.panicattack)
        if (d.depression == "Yes"){
            if(d.gender == "Male"){
                conditionsGender[0].count++
            }
            if (d.gender == "Female"){
                conditionsGender[1].count++
            }
        }
        if (d.anxiety){
            if(d.gender == "Male"){
                conditionsGender[2].count++
            }
            if (d.gender == "Female"){
                conditionsGender[3].count++
            }
        }
        if (d.panicattack){
            if(d.gender == "Male"){
                conditionsGender[4].count++
            }
            if (d.gender == "Female"){
                conditionsGender[5].count++
            }
        }
        
        
    });
    
    console.log("dep_male", conditionsGender[0])
    console.log("anx_male", conditionsGender[2])
    console.log("pan_male", conditionsGender[4])
   
    //Bar graph implementation based on: https://observablehq.com/@d3/grouped-bar-chart/2
    //Set up SVG and Bar Graph
    const svg = d3.select("svg")
        .attr("viewBox", [0, 0, width, height]);

    const bar = svg.append("g")
                .attr("width", barWidth)
                .attr("height", barHeight)
                .attr("style", "max-width: 100%; height: auto;");
    //Encode different conditions 
    const conditions = ["Depression", "Anxiety", "Panic Attacks"]
    const fx = d3.scaleBand()
        .domain(conditions)
        .rangeRound([barMargin.left, barWidth - barMargin.right])
        .paddingInner(0.1);

    //Encode gender scale (color and bars)
    const gender = ["Male", "Female"]
    const x = d3.scaleBand()
        .domain(gender)
        .rangeRound([0, fx.bandwidth()])
        .padding(0.05);

    console.log(gender.length)
    const barColor = d3.scaleOrdinal()
        .domain(gender)
        .range(d3.schemeCategory10.slice(0, gender.length))
        .unknown("#ccc");

    const y = d3.scaleLinear()
        .domain([0, d3.max(conditionsGender, d => d.count)]).nice()
        .rangeRound([barHeight - barMargin.bottom, barMargin.top])
    //Legend (implementation from: https://d3-graph-gallery.com/graph/custom_legend.html)
    var size = 20
    const legend = bar.append("g")
    .attr("transform",`translate(${barWidth-100},${barMargin.top-100})`)
    
    legend.selectAll("mydots")
    .data(gender)
    .enter()
    .append("rect")
        .attr("x", 100)
        .attr("y", function(d,i){ return 100 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("width", size)
        .attr("height", size)
        .style("fill", function(d){ return barColor(d)})

    // Add one dot in the legend for each name.
    legend.selectAll("mylabels")
    .data(gender)
    .enter()
    .append("text")
        .attr("x", 100 + size*1.2)
        .attr("y", function(d,i){ return 100 + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function(d){ return barColor(d)})
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")

    
    //Create groups by condition
    bar.append("g")
        .selectAll()
        .data(conditions)
        .join("g")
          .attr("transform", condition => `translate(${fx(condition)},0)`)
        .selectAll()
        .data(condition =>
            conditionsGender.filter(d => d.condition === condition)
          )
        .join("rect")
          .attr("x", d => x(d.gender))
          .attr("y", d => y(d.count))
          .attr("width", x.bandwidth())
          .attr("height", d => y(0) - y(d.count))
          .attr("fill", d => barColor(d.gender));
          
    // Horizontal axis
    bar.append("g")
        .attr("transform", `translate(0,${barHeight - barMargin.bottom})`)
        .call(d3.axisBottom(fx).tickSizeOuter(0))
        .call(g => g.selectAll(".domain").remove());

    // Vertical axis
    bar.append("g")
        .attr("transform", `translate(${barMargin.left},0)`)
        .call(d3.axisLeft(y).ticks(null, "s"))
        .call(g => g.selectAll(".domain").remove());
    
    //Title 
    bar.append("text")
        .attr("x", barMargin.left + barWidth/3)
        .attr("y", barMargin.top/1.5)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Condition by Gender");

    // Sankey Graph (Major -> Condition -> gpa)
    const sankGraph = svg.append("g")
        .attr("transform", `translate(${sankLeft},${sankTop})`)
        .attr("width", sankWidth)
        .attr("height", sankHeight)
        .attr("style", "max-width: 100%; height: auto;");
    
    
    const conds = [
        { key: "depression",    label: "Depression"    },
        { key: "anxiety",       label: "Anxiety"       },
        { key: "panicattack",   label: "Panic Attacks" }
    ];

    //Find large majors, prepare to add small majors to other

    const majorCounts = d3.rollup(
        data,
        v => v.length,
        d => d.major
    );

    const keepMajors = new Set(
        Array.from(majorCounts)
            .filter(([maj, ct]) => ct >= 10)
            .map(([maj]) => maj)
    )
   
    //Create nodes and flows from data
    const flows = data.flatMap(d =>{
        const maj = keepMajors.has(d.major) ? d.major : "other";
        return conds.flatMap(c => 
            d[c.key] == "Yes"
            ? [
                {source: maj, target: c.label, value: 1},
                {source:c.label, target: d.gpa, value:1}
            ]
            : []
        )
    });

    const names = Array.from(new Set(
        flows.flatMap(f => [f.source, f.target])
    ));

    const nodes = names.map(name => ({name}))
    // Roll up flows and create links between nodes
    const links = Array.from(
        d3.rollup(
            flows,
            vs => vs.length,
            f => f.source,
            f => f.target
        ),
        ([source, tgtMap]) => 
            Array.from(tgtMap, ([target, value]) => ({source,target,value}))
    ).flat();

    console.log(names)
    console.log(flows)
    console.log(links)

    

    const { nodes: skNodes, links: skLinks } = d3.sankey()
        .nodeId(d => d.name)
        .nodeWidth(15)
        .nodePadding(15)
        .nodeAlign(d3.sankeyCenter)
        .extent([[0,0],[sankWidth,sankHeight]])({nodes,links});
        /*.extent([
            [sankMargin.left, sankMargin.top],
            [sankWidth - sankMargin.right, sankHeight - sankMargin.bottom]
        ])({
            nodes: nodes.map(d => ({...d})),
            links: links.map(d => ({...d}))
        });*/

    const sankColor = d3.scaleOrdinal()
        .domain(skNodes.map(d => d.name))
        .range(d3.schemeCategory10);
    
    //Paths
    const linkG = sankGraph.append("g")
        .selectAll("path")
        .data(skLinks)
        .join("path")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", d => d.width)
            .attr("stroke", d => sankColor(d.source.name))
            .attr("fill", "none");
    
    // Nodes

    const nodeG = sankGraph.append("g")
        .selectAll("g")
        .data(skNodes)
        .join("g")
            .attr("transform", d=> `translate(${d.x0}, ${d.y0})`);
    
    nodeG.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => sankColor(d.name));
    let active = null;
    // Implement filter that shows all flows into our out of the node clicked on
    //nodeG.on("click",(_, n) => {
    function highlight(node) {
        console.log("clicked")
        // Create set of linked nodes
        const linked = new Set([
            node.name,
            ...skLinks.filter(l => l.source == node || l.target == node)
                .flatMap(l=>[l.source.name, l.target.name])
        ]);
        // Make all nodes that are not selected or linked transparent
        nodeG.transition().duration(300)
            .style("opacity", d => linked.has(d.name)? 1:0.2)
        // Make all links that are not connected to the node thin and transparent
        linkG.transition().duration(300)
            .style("opacity", d => (d.source == node||d.target ==node)? 1:0.05)
            .attr("stroke-width", d=> 
            (d.source == node || d.target==node)?d.width:0.5
            );
    }

    //Handle returning to regular graph

    function reset() {
        nodeG.transition().style("opacity", 1);
        linkG.transition()
            .style("opacity", 1)
            .attr("stroke-width", d=>d.width);
    }


    nodeG.on("click", (_, n) => {
        if (active == n) {
            active = null;
            reset();
        } else {
            active = n;
            highlight(n)
        }
    })

    //Labels
    
    nodeG.append("text")
        .attr("x", d => d.x0 < (barMargin.left + barWidth/2) ? d.x1 - d.x0 + 6 : -6)
        .attr("y", d => (d.y1 -d.y0)/2)
        .attr("dy", "0.10em")
        .attr("text-anchor", d=> d.x0 < (barMargin.left + barWidth/2) ? "start" : "end")
        .text(d => `${d.name} (${d.value})`)

    // Title

    sankGraph.append("text")
        .attr("x", sankWidth/2)
        .attr("y", -sankMargin.top/2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Major to Condition to GPA")

    
    // Correlation heatmap between conditions and treatment (implementation based on: https://d3-graph-gallery.com/graph/heatmap_basic.html)
    const keys = ["depression","anxiety","panicattack","treatment"]

    const bin = d => d == "Yes" ? 1:0

    // Helper function to calculate phi-correlation
    function phi(a, b){
        const n = data.length;
        let sx=0, sy=0, sxy=0, sx2=0, sy2=0
        data.forEach(d=>{
            const x=bin(d[a]), y=bin(d[b])
            sx += x; sy += y;
            sxy += x*y; sx2 += x*x; sy2 += y*y
        });
        return (n*sxy - sx*sy)/Math.sqrt((n*sx2 - sx*sx)*(n*sy2 - sy*sy));
    }

    const corr = keys.flatMap(a=>
        keys.map(b=>({row:a, col:b, value: phi(a,b)}))
    );

    console.log(corr)
    //Add heatmap object
    const heatGraph = svg.append("g")
        .attr("transform", `translate(${heatLeft + heatMargin.left},${heatTop})`)
        .attr("width", heatWidth)
        .attr("height", heatHeight)
        .attr("style", "max-width: 100%; height: auto;");
    //Add axes for heatmap
    let heatx = d3.scaleBand()
        .range([0, heatWidth])
        .domain(keys)
        .padding(0.01);
    
    let heaty = d3.scaleBand()
        .range([heatHeight, 0])
        .domain(keys)
        .padding(0.01);
    
    heatGraph.append("g")
        .attr("transform", `translate(0,${heatHeight})`)
        .call(d3.axisBottom(heatx))
    heatGraph.append("g")
        .call(d3.axisLeft(heaty))
    //Create color scale for heatmap
    let heatColor = d3.scaleLinear()
        .range(["white", "#69b3a2"])
        .domain([-1,1])
        .clamp(true)
    //Create heatmap rectangles
    heatGraph.selectAll()
        .data(corr, d=> `${d.row}:${d.col}`)
        .join("rect")
        .attr("class", "cell")
        .attr("x", d => heatx(d.col))
        .attr("y", d => heaty(d.row))
        .attr("width", () => heatx.bandwidth())
        .attr("height", () => heaty.bandwidth())
        .attr("fill", d => heatColor(d.value) )

    // Title

    heatGraph.append("text")
        .attr("x", sankWidth/4.5)
        .attr("y", -sankMargin.top/2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Correlations between Conditions and Treatment")

    // Implementing tooltips for heatmap

    // Create a tooltip object for later calling
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'heat-tip')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('opacity', 0);

    // Add a mouseover event to each cell in the heatmap
    heatGraph.selectAll("rect.cell")
        .on("mouseover", (evt, d) => {
            // Get the position of the current cell
            pos = evt.currentTarget.getBoundingClientRect()
            // Emphasize border of current cell
            d3.select(evt.currentTarget)
                .raise()
                .attr("stroke", "#000")
                .attr("stroke-width", 2)
                .attr("opacity", 1);
            // Display tooltip with correlation on cell
            tooltip
                .html(`p=${d3.format(".2f")(d.value)}`)
                .style("opacity", 1)
                .style("left", `${pos.left + pos.width/4 + window.scrollX}px`)
                .style("top", `${pos.top + pos.height/3 + window.scrollY}px`);
        })

        // Clear on mouseout
        .on("mouseout", evt =>{
            d3.select(evt.currentTarget)
                .transition().duration(150)
                .attr("stroke-width", 0)
                .attr("opacity", 0.85);
            
            tooltip
                .style("opacity", 0)
        })

        

 })

