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
  attr_accessor :style # :style
  # Custom defined, due to the fact we need to push the name in front of each
  # attribute
  def style= style
    if source.respond_to? :to_str
      style_doc = CssParser::Parser.new
      style_doc.add_block! style
      # Why can't I use #map? )-:
      styles = []
      style_doc.each_selector do |selectors, declarations, _|
        styles << "#tiles .#{@name}.tile #{selectors} {#{declarations}}"
      end
      @style = styles.join("\n")
    else
      @style = style
    end
  end
  attr_accessor :source # :svg
  # Custom defined, due to the fact we need to validate the presence of the
  # xmlns property.
  def source= source
    if source.respond_to? :to_str
      roots = Hpricot::XML(source.to_s).search('>').reject {|e| e.is_a? Hpricot::Text }
      roots.set(:xmlns => 'http://www.w3.org/2000/svg')
      @source = roots.to_html
    else
      @source = source
    end
  end
  
  def initialize name, opts = {}
    @name = name
    @style = opts[:style] || opts[:css] || nil
    @soure = opts[:source] || opts[:svg] || TileBackground
    
    yield self if block_given?
    
    Tiles << self
  end
  
  def to_h
    {
      :id => Tiles.index(self),
      :name => name,
      :css  => style,
      :svg  => source
    }
  end
end

Tile.new :null # Tile of ID 0 should always be an empty tile named 'null'
Tile.new :test do |tile|
  tile.style = ".background { fill: #00CC00; }"
end

EmptyMap = []
arr = []
6.times {arr << [1]}
6.times {EmptyMap << arr}

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
    ok EmptyMap
  end
  
end
Application = Api # Satisfy Halcyon