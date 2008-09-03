class Tile
  TileBackground = "<rect x='0' y='0' width='100' height='100' class='background'/>"
  
  Tiles = []
  
  def self.[] id
    # if id.respond_to? :to_int # Symbols respond to to_int. WTF!
    if id.is_a? Numeric
      Tiles[id]
    # elsif id.respond_to? :to_str # Unfortunately, Symbol being stupid again.
    elsif id.respond_to? :to_s
      Tiles.select{|i| i.name == id }.first
    else
      nil
    end
  end
  
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
  tile.css = ".background { fill: #FF0000; } .background:hover { fill: #00FF00; }"
end
Tile.new :grass do |tile|
  tile.css = ".background { fill: #009900; }"
end