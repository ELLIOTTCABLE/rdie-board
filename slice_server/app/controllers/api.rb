class Api < Halcyon::Controller
  
  def slice
    unless params[:id].nil?
      return not_found unless slice = Slice[params[:id].to_i]
      ok slice.to_h
    else
      not_found
    end
  end
  
  # Maps are three dismensional, literally - however, the Z dimensional array
  # is just an array of slices that are 'stacked', i.e., rendered in the same
  # position (given by the position in the two parent arrays).
  def map
    unless params[:id].nil?
      return not_found unless map = Map[params[:id].to_i]
      ok map.to_a
    else
      not_found
    end
  end
  
end

Application = Api # Satisfy Halcyon