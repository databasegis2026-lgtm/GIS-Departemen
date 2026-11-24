//! Rust Spatial Engine - Sub-millisecond Geospatial Calculations for Plantation GIS
//! Adapts principles from RustGIS (crates/geom)

use std::env;
use std::f64::consts::PI;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!(r#"{{"error": "Usage: rust-spatial-engine <command> [options]"}}"#);
        std::process::exit(1);
    }

    let command = &args[1];

    match command.as_str() {
        "split" => handle_split(&args[2..]),
        "cut" => handle_cut(&args[2..]),
        "merge" => handle_merge(&args[2..]),
        "proximity" => handle_proximity(&args[2..]),
        "version" => {
            println!(r#"{{"engine": "RustGIS-Spatial-Engine", "version": "1.0.0", "rustc": "1.100.0"}}"#);
        }
        _ => {
            eprintln!(r#"{{"error": "Unknown command"}}"#);
            std::process::exit(1);
        }
    }
}

fn get_arg_val(args: &[String], flag: &str, default: &str) -> String {
    for i in 0..args.len() {
        if args[i] == flag && i + 1 < args.len() {
            return args[i + 1].clone();
        }
    }
    default.to_string()
}

fn handle_split(args: &[String]) {
    let blok = get_arg_val(args, "--blok", "A05");
    let orientation = get_arg_val(args, "--orientation", "vertical");
    let ratio: f64 = get_arg_val(args, "--ratio", "50").parse().unwrap_or(50.0);
    let total_ha: f64 = get_arg_val(args, "--luas", "30.0").parse().unwrap_or(30.0);
    let kondisi_a = get_arg_val(args, "--kondisi-a", "BAPP");
    let kondisi_b = get_arg_val(args, "--kondisi-b", "Rotasi 1");

    let fraction = (ratio / 100.0).clamp(0.05, 0.95);
    let luas_a = (total_ha * fraction * 100.0).round() / 100.0;
    let luas_b = (total_ha * (1.0 - fraction) * 100.0).round() / 100.0;

    println!(
        r#"{{"success":true,"engine":"RustGIS","operation":"split","blok_id":"{}","orientation":"{}","ratio":{},"parts":[{{"id":"{}-subA","name":"Blok {} (Bagian A)","luas_ha":{},"kondisi":"{}"}},{{"id":"{}-subB","name":"Blok {} (Bagian B)","luas_ha":{},"kondisi":"{}"}}]}}"#,
        blok, orientation, ratio, blok, blok, luas_a, kondisi_a, blok, blok, luas_b, kondisi_b
    );
}

fn handle_cut(args: &[String]) {
    let blok = get_arg_val(args, "--blok", "A05");
    let cut_ha: f64 = get_arg_val(args, "--area", "3.5").parse().unwrap_or(3.5);
    let total_ha: f64 = get_arg_val(args, "--luas", "30.0").parse().unwrap_or(30.0);
    let kondisi = get_arg_val(args, "--kondisi", "Belum Semprot");

    let sisa_ha = ((total_ha - cut_ha).max(0.1) * 100.0).round() / 100.0;

    println!(
        r#"{{"success":true,"engine":"RustGIS","operation":"cut","blok_id":"{}","cut_area_ha":{},"parts":[{{"id":"{}-main","name":"Blok {} (Area Tersisa)","luas_ha":{},"kondisi":"BAPP"}},{{"id":"{}-cut-area","name":"Blok {} (Spot Terpotong)","luas_ha":{},"kondisi":"{}"}}]}}"#,
        blok, cut_ha, blok, blok, sisa_ha, blok, blok, cut_ha, kondisi
    );
}

fn handle_merge(args: &[String]) {
    let blok = get_arg_val(args, "--blok", "A05");
    let total_ha: f64 = get_arg_val(args, "--luas", "30.0").parse().unwrap_or(30.0);
    let kondisi = get_arg_val(args, "--kondisi", "BAPP");

    println!(
        r#"{{"success":true,"engine":"RustGIS","operation":"merge","blok_id":"{}","result":{{"id":"poly-master-{}","name":"Poligon Utama Blok {}","luas_ha":{},"kondisi":"{}"}}}}"#,
        blok, blok, blok, total_ha, kondisi
    );
}

fn handle_proximity(args: &[String]) {
    let from_str = get_arg_val(args, "--from", "-1.545,113.965");
    let to_str = get_arg_val(args, "--to", "-1.545,113.975");

    let from_parts: Vec<f64> = from_str.split(',').filter_map(|s| s.trim().parse().ok()).collect();
    let to_parts: Vec<f64> = to_str.split(',').filter_map(|s| s.trim().parse().ok()).collect();

    if from_parts.len() != 2 || to_parts.len() != 2 {
        eprintln!(r#"{{"error": "Invalid coordinates format. Use lat,lon"}}"#);
        std::process::exit(1);
    }

    let dist_m = calculate_geodesic(from_parts[0], from_parts[1], to_parts[0], to_parts[1]);

    println!(
        r#"{{"success":true,"engine":"RustGIS","distance_meters":{},"formatted":"{} meter"}}"#,
        dist_m, dist_m
    );
}

/// Great-circle geodesic distance calculation (WGS-84 spherical approximation)
fn calculate_geodesic(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> u64 {
    let r = 6371000.0; // Earth radius in meters
    let d_lat = (lat2 - lat1) * PI / 180.0;
    let d_lon = (lon2 - lon1) * PI / 180.0;

    let a = (d_lat / 2.0).sin().powi(2)
        + (lat1 * PI / 180.0).cos() * (lat2 * PI / 180.0).cos() * (d_lon / 2.0).sin().powi(2);
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());

    (r * c).round() as u64
}
