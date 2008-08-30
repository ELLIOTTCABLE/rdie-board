require 'halcyon'
require 'api'

Thin::Logging.silent = true if defined? Thin
puts "(in #{Halcyon.root})"
run Halcyon::Runner.new
