<?php
/*
* Plugin Name: Energybit map
* Description: Interactive worldmap displaying projects.
* Version: 1.0
* Author: Peter
* Author URI: https://theenergybit.com
*/

/**
 * Add base for Project Details ACF
 */

function energybit_map_acf_json_load_point( $paths ) {
  $paths[] = dirname(__FILE__) . '/acf';
  return $paths;    
}
add_filter('acf/settings/load_json', 'energybit_map_acf_json_load_point');


/**
 * Shortcode to add map container and que script and style
 */
function energybit_map_shortcode(){

  $query = new WP_Query([
    'post_type' => 'project',
    'post_status' => 'publish',
    'posts_per_page' => '-1'
  ]);

  $projects = array();

  if ( $query->have_posts() ){
    while ( $query->have_posts() ){
      $query->the_post();
      $id = get_the_ID();
      $location = get_field("location");
      $description = get_the_content();
      $featured_image = wp_get_attachment_image_src( get_post_thumbnail_id(), 'full' );

      $project = array(
        "lat" => $location['lat'],
        "lon" => $location['lng'],
        "title" => get_the_title(),
        "link" => get_permalink(),
        "fields" => array()
      );

      foreach (get_fields($id) as $key => $value) {
        if($key !== 'location'){
          $field = get_field_object($key, $id);
          $project['fields'][] = array("label" => $field["label"], "value" => $value);
        }
      };

      $projects[] = $project;  
    }
    wp_reset_postdata();
  }

  $projects = 'let projects = ' . json_encode($projects);
  
  if (!is_admin()) {
    wp_enqueue_style( 'energybit_map_css', plugin_dir_url( __FILE__ ) . 'dist/energy_bit.880022c2.css' );
    wp_enqueue_script( 'energybit_map_main', plugin_dir_url( __FILE__ ) . 'dist/energy_bit.880022c2.js' );
    wp_add_inline_script('energybit_map_main', $projects, 'before');
    return '<div id="energybit-map-container"></div>';
  }
}
add_shortcode('energybit_map', 'energybit_map_shortcode');

?>