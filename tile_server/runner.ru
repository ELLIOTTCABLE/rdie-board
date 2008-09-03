%w[rubygems halcyon hpricot css_parser].each {|dep| require dep }

require 'lib/tile'
require 'lib/map'

require 'app/config'
require 'app/controllers/api'

Thin::Logging.silent = true if defined? Thin
puts "(in #{Halcyon.root})"
run Halcyon::Runner.new
