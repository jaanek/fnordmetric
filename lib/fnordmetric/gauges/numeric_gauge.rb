class FnordMetric::NumericGauge < FnordMetric::MultiGauge

  def initialize(opts)
    @cmds = [:incr]
    
    super(opts)

    if !opts[:series].is_a?(Array) || opts[:series].size == 0
      raise "numeric_gauge #{opts[:key]}: missing option series"
    end

    if !opts[:ticks].is_a?(Array) || opts[:ticks].size == 0
      raise "numeric_gauge #{opts[:key]}: missing option ticks"
    end

    opts[:series] = opts[:series].map(&:to_sym)

    if opts[:ticks].any?{ |t| !t.is_a?(Fixnum) }
      raise "numeric_gauge #{opts[:key]}: these are not numbers: #{opts[:ticks].inspect}"
    end

    if opts[:series].size != opts[:series].uniq.size
      raise "numeric_gauge #{opts[:key]}: series are not unique"
    end


    @overview_timeline = timeline_widget(
      :tab => "Overview",
      :title => "Totals",
      :render_target => ".viewport_inner",
      :ticks => @opts[:ticks],
      :series => @opts[:series],
      :series_titles => Hash[@opts[:series].map{|s| [s, s]}],
      :include_current => true,
      :height => 350
    )

    @overview_timeline.on(:values_at) do |_series, _ticks, _tick|
      Hash[_ticks.map{ |_t| [_t, 23] }]
    end


  end



  def incr(*args)
    ctx = args.delete_at(0)

    if args.size == 0 || (args.size == 1 && args.first.is_a?(Fixnum))
      incr_series(ctx, *args.unshift(:_default))
    elsif args.size == 1 || (args.size == 2 && args.last.is_a?(Fixnum))
      incr_series(ctx, *args)
    else
      raise "invalid arguments for incr: #{args.inspect}"
    end
  end

  def incr_series(ctx, series, value = 1)
    if (series == :_default) && @opts[:series].size > 1
      raise "don't know which series to increment - available: #{series}"
    elsif series == :_default
      series = @opts[:series].first
    end

    unless @opts[:series].include?(series)
      raise "unknown series: #{series}"
    end

    series_count_gauges[series].values.each do |gauge|
      ctx.incr(gauge, value)
    end
  end

private

  def series_count_gauges
    @series_gauges ||= Hash[@opts[:series].map do |series|
      [series, Hash[@opts[:ticks].map do |tick|
        [tick.to_i, FnordMetric::Gauge.new(
          :key => "count-#{series}", 
          :key_prefix => key,
          :tick => tick.to_i,
        )]
      end]]
    end]
  end

end