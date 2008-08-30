%w[rubygems halcyon hpricot css_parser].each {|dep| require dep }

Halcyon.config.use {|c| c[:allow_from] = :all ; c[:environment] = :development }
Halcyon::Application.route do |r|
  
  # Could use :controller, but I wanted to be semantic - /api is the API
  # server 'root', because that's the path that the webserver proxies to the
  # API server's port. However, 'api' is the replacement for 'Application' as
  # the default controller.
  r.match('/api/:action/:id').to  :controller => 'api'
  r.match('/api/:action/').to     :controller => 'api'
  r.match('/api/:action').to      :controller => 'api'
  r.match('/api/').to             :controller => 'api'
  r.match('/api').to              :controller => 'api'

end


class Tile
  TileBackground = "<rect x='0' y='0' width='100' height='100' class='background'/>"
  
  Tiles = []
  attr_reader :name
  attr_accessor :css
  # Custom defined, due to the fact we need to push the name in front of each
  # attribute
  def css= css
    if css.respond_to? :to_str
      css_doc = CssParser::Parser.new
      css_doc.add_block! css
      # Why can't I use #map? )-:
      styles = []
      css_doc.each_selector do |selectors, declarations, _|
        styles << "#tiles .#{@name}.tile #{selectors} {#{declarations}}"
      end
      @css = styles.join("\n")
    else
      @css = css
    end
  end
  attr_accessor :svg
  # Custom defined, due to the fact we need to validate the presence of the
  # xmlns property.
  def svg= svg
    if svg.respond_to? :to_str
      roots = Hpricot::XML(svg.to_s).search('>').reject {|e| e.is_a? Hpricot::Text }
      roots.set(:xmlns => 'http://www.w3.org/2000/svg')
      @svg = roots.to_html
    else
      @svg = svg
    end
  end
  
  def initialize name, opts = {}
    @name = name
    self.css = opts[:css] || nil
    self.svg = opts[:svg] || TileBackground
    
    yield self if block_given?
    
    Tiles << self
  end
  
  def to_h
    {
      :id => Tiles.index(self),
      :name => @name,
      :css  => @css,
      :svg  => @svg
    }
  end
end

Tile.new :null # Tile of ID 0 should always be an empty tile named 'null'
Tile.new :test do |tile|
  tile.css = ".background { fill: #00AA00; }"
end
Tile.new :grass do |tile|
  tile.css = ".background { fill: #009900; }"
end

TestMap = []
arr = []
20.times {arr << [2]}
20.times {TestMap << arr}

class Api < Halcyon::Controller
  
  def tile
    unless params[:id].nil?
      return not_found unless tile = Tile::Tiles[params[:id].to_i]
      ok tile.to_h
    else
      not_found
    end
  end
  
  # Maps are three dismensional, literally - however, the Z dimensional array
  # is just an array of tiles that are 'stacked', i.e., rendered in the same
  # position (given by the position in the two parent arrays)
  def map
    ok TestMap
  end
  
end
Application = Api # Satisfy Halcyon