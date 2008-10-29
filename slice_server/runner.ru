%w[rubygems halcyon hpricot css_parser].each {|dep| require dep }
($:.unshift File.expand_path( File.dirname(__FILE__) )).uniq!

# = Library
require 'lib/slice'
require 'lib/map'

# = Halcyon application
require 'app/config'
require 'app/controllers/api'

# Stolen from one of Halcyon's examples:
# http://github.com/mtodd/halcyon/tree/f926f5b6e9af3730df93f0d4c02d44d241d6ec0c/examples/guesser/runner.ru

# = Apps
# The applications to try.
apps = []

# = Redirecter
# Requests to `/` get redirected to `/index.xhtml`.
apps << lambda do |env|
  case env['PATH_INFO']
  when '/'
    puts " ~ Redirecting to /index.xhtml"
    [302, {'Location' => '/index.xhtml'}, ""]
  else
    [404, {}, ""]
  end
end

# = Static Server
# Make sure that the static resources are accessible from the same address so
# we don't have to worry about the XHR Same Origin stuff.
apps << Rack::File.new(Halcyon.root / 'static')

# Have to make sure XHTML works. This is better handled in the latest changes
# to Rack, but we want to work with 0.4.0 (release version at this time).
Rack::File::MIME_TYPES['xhtml'] = 'application/xhtml+xml'

# = Halcyon App
apps << Halcyon::Runner.new

Thin::Logging.silent = true if defined? Thin
puts "(in #{Halcyon.root})"
run Rack::Cascade.new(apps)
