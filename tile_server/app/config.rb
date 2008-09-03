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