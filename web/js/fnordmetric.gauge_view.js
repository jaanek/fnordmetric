FnordMetric.views.gaugeView = (function(gauge_name){
  var widgets = [];
  var widget_objs = {};
  var viewport = null;
  var tabs = [];
  var conf = {};
  var tick;

  var start_timestamp, end_timestamp;

  function load(_viewport){
    viewport = _viewport;
    viewport.html('');
    viewport.append('<div class="navbar"></div>');
    viewport.append($('<div class="gauge_viewport"></div>'));

    conf.title = gauge_name;
    tick = Math.max(3600, FnordMetric.gauges[gauge_name].tick);

    FnordMetric.ui.navbar($('.navbar', viewport), {
      breadcrumb: [ 
        ["Fnord", "/group/fnord"],
        [conf.title, "/gauge/"+gauge_name]
      ],
      buttons: [
        ["<i class='icon-refresh'></i>Refresh", function(){ load(viewport); }]
      ],
      datepicker: true
    });

    var now = parseInt((new Date()).getTime() / 1000);

    start_timestamp = atTick((now-(tick*24)));
    end_timestamp   = atTick(now);

    updateDatepicker();
    load_interval();
  }

  function atTick(t){
    return (Math.ceil(t / tick) * tick);
  }

  function close(){

  }

  function resize(){

  }

  function updateDatepicker(){
    $(".navbar .datepicker .date", viewport).html(
      FnordMetric.util.dateFormat(start_timestamp) +
      '&nbsp;&dash;&nbsp;' +
      FnordMetric.util.dateFormat(end_timestamp)
    ).parent().click(function(){
      open_interval_modal();
    });
  }

  function announce(evt){
    if ((evt.gauge != gauge_name) ||
       (evt.type != "render_response") ||
       (!evt.payload)){ return true; }

    if(evt.payload.html){
      $('.gauge_viewport', viewport)
        .html(evt.payload.html); 
    }

    if(evt.payload.exec){
      eval(evt.payload.exec); 
    }

    FnordMetric.resizeView();
  }

  function open_interval_modal(){
    var interval_list = $('<ul>');
    var now = parseInt((new Date()).getTime() / 1000);

    for(n=0; n < 10; n++){
      var interval = now;
      now -= 3600;
      interval += "-" + now;
      interval_list.append(
        $('<li>')
          .html($('<a href="#">')
          .html(interval)
          .attr('data', interval)
          .click(function(){
            select_interval($(this).attr('data'))
          }))
      );
    }

    FnordMetric.ui.modal({
      height: 400,
      max_width: 900,
      content: interval_list
    });
  }

  function select_interval(inter){
    start_timestamp = parseInt(inter.split("-")[0]);
    end_timestamp = parseInt(inter.split("-")[1]);
    updateDatepicker();
    load_interval();
    FnordMetric.ui.close_modal(this);
  }

  function load_interval(){
    $('.gauge_viewport', viewport)
      .html("");

    FnordMetric.publish({
      "gauge": gauge_name,
      "type": "render_request",
      "interval": start_timestamp + "-" + end_timestamp
    })
  }

  return {
    load: load,
    resize: resize,
    announce: announce,
    close: close
  };

});