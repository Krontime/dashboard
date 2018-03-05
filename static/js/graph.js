queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);
    
function pluckeroo(column) {
    return function(d) {
        return d[column];
    };
}    

function makeGraphs(error, salariesData) {
    
    let ndx = crossfilter(salariesData);

    salariesData.forEach(function(d) {
        d.salary = parseInt(d.salary);
    });
    
    
    show_select_disipline(ndx);
    show_sex_count(ndx);
    show_sex_average(ndx);
    show_percent_prof_by_sex(ndx, "Female", "#percent_women_prof");
    show_percent_prof_by_sex(ndx, "Male", "#percent_men_prof");
    show_salary_to_service(ndx);
    show_phd_to_service(ndx);
    show_rank_distribution(ndx);
    
    dc.renderAll()
}

function show_percent_prof_by_sex(ndx, gender, element) {
    
    let all_records = ndx.groupAll();
    
    let matches_that_are_professors = all_records.reduce(
        function(p, v)  {
            if (v.sex === gender) {
                p.total_found += 1;
                if (v.rank === "Prof") {
                    p.are_prof += 1;
                }
                p.percent = (p.are_prof / p.total_found).toFixed(2);
            }
            return p;
        },
        function(p, v)  {
            if (v.sex === gender) {
                p.total_found -= 1;
                if (p.total_found > 0) {
                    if (v.rank === "Prof") {
                        p.are_prof -= 1;
                    }
                    p.percent = (p.are_prof / p.women_found).toFixed(2);
                } else {
                    p.are_prof = 0;
                    p.percent = 0;
                }
            }
            return p;
        },
        function()  {
            return { total_found: 0, are_prof: 0, percent: 0 };
        });
        
    dc.numberDisplay(element)
        .formatNumber(d3.format(".2%"))
        .valueAccessor(function (d) {
            return d.percent;
        })
        .group(matches_that_are_professors);
}

function show_select_disipline(ndx) {
    let discipline_dim = ndx.dimension(pluckeroo("discipline"));
    let discipline_group = discipline_dim.group();
    
    dc.selectMenu("#select_descipline")
        .dimension(discipline_dim)
        .group(discipline_group);
}

function show_sex_count(ndx) {
    let group_by_sex = ndx.dimension(pluckeroo("sex"));
    let count_by_sex = group_by_sex.group().reduceCount();
    
    dc.barChart("#sex_sal_chart_here")
        .width(800)
        .height(290)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(group_by_sex)
        .group(count_by_sex)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Sex")
        .yAxisLabel("Salary")
        .yAxis().ticks(6);
}

function show_sex_average(ndx) {
    let group_by_sex = ndx.dimension(pluckeroo("sex"));
    let salary_by_sex = group_by_sex.group().reduce(
        function(p, v)  {
            p.count++;
            p.total += v.salary;
            p.average = p.total/p.count;
            return p;
        },
        function(p, v)  {
            p.count--;
            if (p.count > 0) {
                p.total += v.salary;
                p.average = p.total/p.count;
            } else {
                p.total = 0;
                p.average = 0;
            }
            return p;
        },
        function()  {
            return {count: 0, total: 0, average: 0};
        }
    );
    
    dc.barChart("#sex_average_chart_here")
        .width(800)
        .height(290)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(group_by_sex)
        .group(salary_by_sex)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .valueAccessor(function(d) {
            return d.value.average.toFixed(2)
        })
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Sex")
        .yAxisLabel("Salary")
        .yAxis().ticks(6);

}

function show_salary_to_service(ndx) {
    
    let genderColors = d3.scale.ordinal()
        .domain(["Female", "Male"])
        .range(["pink", "blue"]);

    let eDim = ndx.dimension(dc.pluck("yrs.service"));
    let experienceDim = ndx.dimension(function(d){
        return [d.yrs_service, d.salary, d.rank, d.sex];
    });
    let experienceSalaryGroup = experienceDim.group();

    let minExperience = eDim.bottom(1)[0].yrs_service;
    let maxExperience = eDim.top(1)[0].yrs_service;
    
    dc.scatterPlot("#show_salary_to_service")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minExperience,maxExperience]))
        .brushOn(true)
        .symbolSize(8)
        .clipPadding(10)
        .yAxisLabel("Salary")
        .xAxisLabel("Years Of Service")
        .title(function (d) {
            return d.key[2] + " earned " + d.key[1];
        })
        .colorAccessor(function (d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(experienceDim)
        .group(experienceSalaryGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
        
}

function show_phd_to_service(ndx) {
    
    let genderColors = d3.scale.ordinal()
        .domain(["Female", "Male"])
        .range(["pink", "blue"]);

    let eDim = ndx.dimension(dc.pluck("yrs_since_phd"));
    let yearsDim = ndx.dimension(function(d){
        return [d.yrs_since_phd, d.salary, d.rank, d.sex];
    });
    let yearsSalaryGroup = yearsDim.group();

    let minYears = eDim.bottom(1)[0].yrs_since_phd;
    let maxYears = eDim.top(1)[0].yrs_since_phd;

    dc.scatterPlot("#show_phd_to_service")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minYears,maxYears]))
        .brushOn(true)
        .symbolSize(8)
        .clipPadding(10)
        .yAxisLabel("Salary")
        .xAxisLabel("Years Since PHD")
        .title(function(d) {
            return d.key[0] + " earned " + d.key[1];
        })
        .colorAccessor(function (d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(yearsDim)
        .group(yearsSalaryGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
        
}

function get_percent_rank_by_gender(ndx, rank) {
    let group_by_sex = ndx.dimension(pluckeroo("sex"));
    return group_by_sex.group().reduce(
            function(p, v)  {
                p.total_found += 1;
                if (v.rank == rank) {
                    p.are_prof += 1;
                }
                p.percent = (p.are_prof / p.total_found);
            return p;
            },
            function(p, v)  {
                p.total_found -= 1;
                if (p.total_found > 0) {
                    if (v.rank == rank) {
                        p.are_prof -= 1;
                    }
                    p.percent = (p.are_prof / p.women_found);
                } else {
                    p.are_prof = 0;
                    p.percent = 0;
                }
                return p;
            },
            function()  {
                return { total_found: 0, are_prof: 0, percent: 0 };
            });
}

function show_rank_distribution(ndx) {
    
    let group_by_sex = ndx.dimension(pluckeroo("sex"));
    
    let percent_prof_by_gender = get_percent_rank_by_gender(ndx, "Prof");
    let percent_assoc_by_gender = get_percent_rank_by_gender(ndx, "AssocProf");
    let percent_asst_by_gender = get_percent_rank_by_gender(ndx, "AsstProf");
    
    dc.barChart("#show_rank_distribution")
        .width(800)
        .height(290)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        // .formatNumber(d3.format(".2%"))
        .dimension(group_by_sex)
        .group(percent_prof_by_gender)
        .stack(percent_assoc_by_gender)
        .stack(percent_asst_by_gender)
        .transitionDuration(500)
        .valueAccessor(function(d) {
            return d.value.percent;
        })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Sex")
        .yAxisLabel("Percent")
        .yAxis().ticks(6);
    
    
}