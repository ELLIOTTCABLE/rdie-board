class Map
  Maps = []
  
  def self.[] id
    Maps[id]
  end
  
  attr_accessor :tiles
  
  def initialize tiles = [[]], opts = {}
    @tiles = opts[:tiles] || tiles
    
    yield self if block_given?
    
    Maps << self
  end
  
  alias_method :to_a, :tiles
end

Map.new [[0, 0], [0, 0]] # Map of ID 0 should always be an empty 2x2 map of 'null' tiles.
Map.new( Array.new(10){|| Array.new(10, [1]) } ) # Empty test map, 10x10
Map.new( Array.new(10){|| Array.new(10, [2]) } ) # Empty grass map, 10x10
Map.new( Array.new(25){|| Array.new(25, [2]) } ) # Empty grass map, 25x25
Map.new( Array.new(75){|| Array.new(75, [2]) } ) # Empty grass map, 75x75