export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      awards: {
        Row: {
          award: string
          franchise_id: string | null
          player_id: string | null
          position: string | null
          recipient_name: string
          season: number
          sync_run_id: number | null
        }
        Insert: {
          award: string
          franchise_id?: string | null
          player_id?: string | null
          position?: string | null
          recipient_name: string
          season: number
          sync_run_id?: number | null
        }
        Update: {
          award?: string
          franchise_id?: string | null
          player_id?: string | null
          position?: string | null
          recipient_name?: string
          season?: number
          sync_run_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "awards_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      conferences: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          apy_cap_pct: number | null
          apy_millions: number | null
          contract_key: string
          franchise_id: string | null
          guaranteed_millions: number | null
          is_active: boolean | null
          otc_id: number | null
          player_id: string | null
          player_name: string
          position: string | null
          sync_run_id: number | null
          team_name: string | null
          value_millions: number | null
          year_signed: number | null
          years: number | null
        }
        Insert: {
          apy_cap_pct?: number | null
          apy_millions?: number | null
          contract_key: string
          franchise_id?: string | null
          guaranteed_millions?: number | null
          is_active?: boolean | null
          otc_id?: number | null
          player_id?: string | null
          player_name: string
          position?: string | null
          sync_run_id?: number | null
          team_name?: string | null
          value_millions?: number | null
          year_signed?: number | null
          years?: number | null
        }
        Update: {
          apy_cap_pct?: number | null
          apy_millions?: number | null
          contract_key?: string
          franchise_id?: string | null
          guaranteed_millions?: number | null
          is_active?: boolean | null
          otc_id?: number | null
          player_id?: string | null
          player_name?: string
          position?: string | null
          sync_run_id?: number | null
          team_name?: string | null
          value_millions?: number | null
          year_signed?: number | null
          years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          coverage: string | null
          id: string
          last_sync_run_id: number | null
          last_synced_at: string | null
          license: string | null
          name: string
          upstream_updated_at: string | null
          url: string
        }
        Insert: {
          coverage?: string | null
          id: string
          last_sync_run_id?: number | null
          last_synced_at?: string | null
          license?: string | null
          name: string
          upstream_updated_at?: string | null
          url: string
        }
        Update: {
          coverage?: string | null
          id?: string
          last_sync_run_id?: number | null
          last_synced_at?: string | null
          license?: string | null
          name?: string
          upstream_updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_last_sync_run_id_fkey"
            columns: ["last_sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      depth_charts: {
        Row: {
          as_of: string
          depth: number
          formation: string
          franchise_id: string
          player_id: string | null
          player_name: string
          position: string
          position_name: string | null
          slot: number
          sync_run_id: number | null
          unit: string
        }
        Insert: {
          as_of: string
          depth: number
          formation: string
          franchise_id: string
          player_id?: string | null
          player_name: string
          position: string
          position_name?: string | null
          slot: number
          sync_run_id?: number | null
          unit: string
        }
        Update: {
          as_of?: string
          depth?: number
          formation?: string
          franchise_id?: string
          player_id?: string | null
          player_name?: string
          position?: string
          position_name?: string | null
          slot?: number
          sync_run_id?: number | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "depth_charts_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depth_charts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depth_charts_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          active: boolean
          conference_id: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          conference_id: string
          id: string
          name: string
        }
        Update: {
          active?: boolean
          conference_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "divisions_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_picks: {
        Row: {
          age: number | null
          all_pro_count: number | null
          career_av: number | null
          college: string | null
          franchise_id: string | null
          games: number | null
          is_hof: boolean
          last_season: number | null
          pfr_player_id: string | null
          pick: number
          player_id: string | null
          player_name: string
          position: string | null
          pro_bowl_count: number | null
          round: number
          season: number
          seasons_started: number | null
          side: string | null
          sync_run_id: number | null
          team_abbr: string
        }
        Insert: {
          age?: number | null
          all_pro_count?: number | null
          career_av?: number | null
          college?: string | null
          franchise_id?: string | null
          games?: number | null
          is_hof?: boolean
          last_season?: number | null
          pfr_player_id?: string | null
          pick: number
          player_id?: string | null
          player_name: string
          position?: string | null
          pro_bowl_count?: number | null
          round: number
          season: number
          seasons_started?: number | null
          side?: string | null
          sync_run_id?: number | null
          team_abbr: string
        }
        Update: {
          age?: number | null
          all_pro_count?: number | null
          career_av?: number | null
          college?: string | null
          franchise_id?: string | null
          games?: number | null
          is_hof?: boolean
          last_season?: number | null
          pfr_player_id?: string | null
          pick?: number
          player_id?: string | null
          player_name?: string
          position?: string | null
          pro_bowl_count?: number | null
          round?: number
          season?: number
          seasons_started?: number | null
          side?: string | null
          sync_run_id?: number | null
          team_abbr?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_picks_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_picks_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_picks_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_eras: {
        Row: {
          city: string
          end_season: number | null
          franchise_id: string
          lat: number | null
          lng: number | null
          location: string
          name: string
          nickname: string
          note: string | null
          start_season: number
          state: string | null
          sync_run_id: number | null
        }
        Insert: {
          city: string
          end_season?: number | null
          franchise_id: string
          lat?: number | null
          lng?: number | null
          location: string
          name: string
          nickname: string
          note?: string | null
          start_season: number
          state?: string | null
          sync_run_id?: number | null
        }
        Update: {
          city?: string
          end_season?: number | null
          franchise_id?: string
          lat?: number | null
          lng?: number | null
          location?: string
          name?: string
          nickname?: string
          note?: string | null
          start_season?: number
          state?: string | null
          sync_run_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "franchise_eras_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_eras_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      franchises: {
        Row: {
          color_primary: string | null
          color_quaternary: string | null
          color_secondary: string | null
          color_tertiary: string | null
          division_id: string
          founded_season: number
          id: string
          location: string
          logo_squared_url: string | null
          logo_url: string | null
          name: string
          nickname: string
          notes: string[]
          origin_league: string
          sync_run_id: number | null
          wordmark_url: string | null
        }
        Insert: {
          color_primary?: string | null
          color_quaternary?: string | null
          color_secondary?: string | null
          color_tertiary?: string | null
          division_id: string
          founded_season: number
          id: string
          location: string
          logo_squared_url?: string | null
          logo_url?: string | null
          name: string
          nickname: string
          notes?: string[]
          origin_league: string
          sync_run_id?: number | null
          wordmark_url?: string | null
        }
        Update: {
          color_primary?: string | null
          color_quaternary?: string | null
          color_secondary?: string | null
          color_tertiary?: string | null
          division_id?: string
          founded_season?: number
          id?: string
          location?: string
          logo_squared_url?: string | null
          logo_url?: string | null
          name?: string
          nickname?: string
          notes?: string[]
          origin_league?: string
          sync_run_id?: number | null
          wordmark_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "franchises_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchises_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      front_office: {
        Row: {
          franchise_id: string
          note: string | null
          person_name: string
          role: string
          since_season: number | null
          source_url: string | null
          sync_run_id: number | null
          verified_on: string | null
        }
        Insert: {
          franchise_id: string
          note?: string | null
          person_name: string
          role: string
          since_season?: number | null
          source_url?: string | null
          sync_run_id?: number | null
          verified_on?: string | null
        }
        Update: {
          franchise_id?: string
          note?: string | null
          person_name?: string
          role?: string
          since_season?: number | null
          source_url?: string | null
          sync_run_id?: number | null
          verified_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "front_office_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "front_office_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      game_flow: {
        Row: {
          game_id: string
          scoring_plays: Json
          sync_run_id: number | null
          win_probability: Json
        }
        Insert: {
          game_id: string
          scoring_plays: Json
          sync_run_id?: number | null
          win_probability: Json
        }
        Update: {
          game_id?: string
          scoring_plays?: Json
          sync_run_id?: number | null
          win_probability?: Json
        }
        Relationships: [
          {
            foreignKeyName: "game_flow_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_flow_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          away_abbr: string
          away_coach: string | null
          away_franchise_id: string | null
          away_qb_id: string | null
          away_qb_name: string | null
          away_rest: number | null
          away_score: number | null
          div_game: boolean | null
          espn_id: string | null
          game_type: string
          gameday: string
          gametime: string | null
          home_abbr: string
          home_coach: string | null
          home_franchise_id: string | null
          home_qb_id: string | null
          home_qb_name: string | null
          home_rest: number | null
          home_score: number | null
          id: string
          location: string | null
          overtime: boolean | null
          pfr_id: string | null
          referee: string | null
          roof: string | null
          season: number
          spread_line: number | null
          surface: string | null
          sync_run_id: number | null
          temp: number | null
          total_line: number | null
          venue_id: string | null
          venue_name: string | null
          week: number
          weekday: string | null
          wind: number | null
        }
        Insert: {
          away_abbr: string
          away_coach?: string | null
          away_franchise_id?: string | null
          away_qb_id?: string | null
          away_qb_name?: string | null
          away_rest?: number | null
          away_score?: number | null
          div_game?: boolean | null
          espn_id?: string | null
          game_type: string
          gameday: string
          gametime?: string | null
          home_abbr: string
          home_coach?: string | null
          home_franchise_id?: string | null
          home_qb_id?: string | null
          home_qb_name?: string | null
          home_rest?: number | null
          home_score?: number | null
          id: string
          location?: string | null
          overtime?: boolean | null
          pfr_id?: string | null
          referee?: string | null
          roof?: string | null
          season: number
          spread_line?: number | null
          surface?: string | null
          sync_run_id?: number | null
          temp?: number | null
          total_line?: number | null
          venue_id?: string | null
          venue_name?: string | null
          week: number
          weekday?: string | null
          wind?: number | null
        }
        Update: {
          away_abbr?: string
          away_coach?: string | null
          away_franchise_id?: string | null
          away_qb_id?: string | null
          away_qb_name?: string | null
          away_rest?: number | null
          away_score?: number | null
          div_game?: boolean | null
          espn_id?: string | null
          game_type?: string
          gameday?: string
          gametime?: string | null
          home_abbr?: string
          home_coach?: string | null
          home_franchise_id?: string | null
          home_qb_id?: string | null
          home_qb_name?: string | null
          home_rest?: number | null
          home_score?: number | null
          id?: string
          location?: string | null
          overtime?: boolean | null
          pfr_id?: string | null
          referee?: string | null
          roof?: string | null
          season?: number
          spread_line?: number | null
          surface?: string | null
          sync_run_id?: number | null
          temp?: number | null
          total_line?: number | null
          venue_id?: string | null
          venue_name?: string | null
          week?: number
          weekday?: string | null
          wind?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_away_franchise_id_fkey"
            columns: ["away_franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_home_franchise_id_fkey"
            columns: ["home_franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      head_coaches: {
        Row: {
          coach_name: string
          end_season: number | null
          franchise_id: string
          is_interim: boolean
          note: string | null
          playoff_losses: number | null
          playoff_wins: number | null
          regular_losses: number | null
          regular_ties: number | null
          regular_wins: number | null
          start_season: number
          sync_run_id: number | null
        }
        Insert: {
          coach_name: string
          end_season?: number | null
          franchise_id: string
          is_interim?: boolean
          note?: string | null
          playoff_losses?: number | null
          playoff_wins?: number | null
          regular_losses?: number | null
          regular_ties?: number | null
          regular_wins?: number | null
          start_season: number
          sync_run_id?: number | null
        }
        Update: {
          coach_name?: string
          end_season?: number | null
          franchise_id?: string
          is_interim?: boolean
          note?: string | null
          playoff_losses?: number | null
          playoff_wins?: number | null
          regular_losses?: number | null
          regular_ties?: number | null
          regular_wins?: number | null
          start_season?: number
          sync_run_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "head_coaches_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "head_coaches_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      injury_reports: {
        Row: {
          franchise_id: string | null
          game_type: string
          player_id: string | null
          player_name: string
          position: string | null
          practice_status: string | null
          primary_injury: string | null
          report_status: string | null
          season: number
          secondary_injury: string | null
          sync_run_id: number | null
          team_abbr: string
          week: number
        }
        Insert: {
          franchise_id?: string | null
          game_type: string
          player_id?: string | null
          player_name: string
          position?: string | null
          practice_status?: string | null
          primary_injury?: string | null
          report_status?: string | null
          season: number
          secondary_injury?: string | null
          sync_run_id?: number | null
          team_abbr: string
          week: number
        }
        Update: {
          franchise_id?: string | null
          game_type?: string
          player_id?: string | null
          player_name?: string
          position?: string | null
          practice_status?: string | null
          primary_injury?: string | null
          report_status?: string | null
          season?: number
          secondary_injury?: string | null
          sync_run_id?: number | null
          team_abbr?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "injury_reports_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "injury_reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "injury_reports_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      narratives: {
        Row: {
          body: string
          entity_id: string
          entity_type: string
          generated_by: string | null
          kind: string
          sources: Json
          status: string
          updated_at: string
        }
        Insert: {
          body: string
          entity_id: string
          entity_type: string
          generated_by?: string | null
          kind: string
          sources?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          body?: string
          entity_id?: string
          entity_type?: string
          generated_by?: string | null
          kind?: string
          sources?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_game_snaps: {
        Row: {
          defense_pct: number | null
          defense_snaps: number | null
          franchise_id: string | null
          game_id: string
          offense_pct: number | null
          offense_snaps: number | null
          player_id: string
          position: string | null
          season: number
          st_pct: number | null
          st_snaps: number | null
          sync_run_id: number | null
          team_abbr: string
          week: number
        }
        Insert: {
          defense_pct?: number | null
          defense_snaps?: number | null
          franchise_id?: string | null
          game_id: string
          offense_pct?: number | null
          offense_snaps?: number | null
          player_id: string
          position?: string | null
          season: number
          st_pct?: number | null
          st_snaps?: number | null
          sync_run_id?: number | null
          team_abbr: string
          week: number
        }
        Update: {
          defense_pct?: number | null
          defense_snaps?: number | null
          franchise_id?: string | null
          game_id?: string
          offense_pct?: number | null
          offense_snaps?: number | null
          player_id?: string
          position?: string | null
          season?: number
          st_pct?: number | null
          st_snaps?: number | null
          sync_run_id?: number | null
          team_abbr?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_game_snaps_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_game_snaps_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_game_snaps_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_game_snaps_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      player_game_stats: {
        Row: {
          attempts: number | null
          carries: number | null
          completions: number | null
          def_fumbles_forced: number | null
          def_interceptions: number | null
          def_pass_defended: number | null
          def_qb_hits: number | null
          def_sacks: number | null
          def_safeties: number | null
          def_tackle_assists: number | null
          def_tackles_for_loss: number | null
          def_tackles_solo: number | null
          def_tds: number | null
          fg_att: number | null
          fg_long: number | null
          fg_made: number | null
          fg_made_50_plus: number | null
          franchise_id: string | null
          fumbles_lost: number | null
          game_id: string
          kickoff_return_yards: number | null
          kickoff_returns: number | null
          opponent_abbr: string | null
          passing_2pt_conversions: number | null
          passing_air_yards: number | null
          passing_cpoe: number | null
          passing_epa: number | null
          passing_first_downs: number | null
          passing_interceptions: number | null
          passing_tds: number | null
          passing_yards: number | null
          passing_yards_after_catch: number | null
          pat_att: number | null
          pat_made: number | null
          player_id: string
          position: string | null
          punt_return_yards: number | null
          punt_returns: number | null
          punt_yards: number | null
          punts: number | null
          punts_inside_20: number | null
          receiving_2pt_conversions: number | null
          receiving_air_yards: number | null
          receiving_epa: number | null
          receiving_first_downs: number | null
          receiving_tds: number | null
          receiving_yards: number | null
          receiving_yards_after_catch: number | null
          receptions: number | null
          rushing_2pt_conversions: number | null
          rushing_epa: number | null
          rushing_first_downs: number | null
          rushing_tds: number | null
          rushing_yards: number | null
          sack_yards_lost: number | null
          sacks_suffered: number | null
          season: number
          season_type: string
          special_teams_tds: number | null
          sync_run_id: number | null
          targets: number | null
          team_abbr: string
          week: number
        }
        Insert: {
          attempts?: number | null
          carries?: number | null
          completions?: number | null
          def_fumbles_forced?: number | null
          def_interceptions?: number | null
          def_pass_defended?: number | null
          def_qb_hits?: number | null
          def_sacks?: number | null
          def_safeties?: number | null
          def_tackle_assists?: number | null
          def_tackles_for_loss?: number | null
          def_tackles_solo?: number | null
          def_tds?: number | null
          fg_att?: number | null
          fg_long?: number | null
          fg_made?: number | null
          fg_made_50_plus?: number | null
          franchise_id?: string | null
          fumbles_lost?: number | null
          game_id: string
          kickoff_return_yards?: number | null
          kickoff_returns?: number | null
          opponent_abbr?: string | null
          passing_2pt_conversions?: number | null
          passing_air_yards?: number | null
          passing_cpoe?: number | null
          passing_epa?: number | null
          passing_first_downs?: number | null
          passing_interceptions?: number | null
          passing_tds?: number | null
          passing_yards?: number | null
          passing_yards_after_catch?: number | null
          pat_att?: number | null
          pat_made?: number | null
          player_id: string
          position?: string | null
          punt_return_yards?: number | null
          punt_returns?: number | null
          punt_yards?: number | null
          punts?: number | null
          punts_inside_20?: number | null
          receiving_2pt_conversions?: number | null
          receiving_air_yards?: number | null
          receiving_epa?: number | null
          receiving_first_downs?: number | null
          receiving_tds?: number | null
          receiving_yards?: number | null
          receiving_yards_after_catch?: number | null
          receptions?: number | null
          rushing_2pt_conversions?: number | null
          rushing_epa?: number | null
          rushing_first_downs?: number | null
          rushing_tds?: number | null
          rushing_yards?: number | null
          sack_yards_lost?: number | null
          sacks_suffered?: number | null
          season: number
          season_type: string
          special_teams_tds?: number | null
          sync_run_id?: number | null
          targets?: number | null
          team_abbr: string
          week: number
        }
        Update: {
          attempts?: number | null
          carries?: number | null
          completions?: number | null
          def_fumbles_forced?: number | null
          def_interceptions?: number | null
          def_pass_defended?: number | null
          def_qb_hits?: number | null
          def_sacks?: number | null
          def_safeties?: number | null
          def_tackle_assists?: number | null
          def_tackles_for_loss?: number | null
          def_tackles_solo?: number | null
          def_tds?: number | null
          fg_att?: number | null
          fg_long?: number | null
          fg_made?: number | null
          fg_made_50_plus?: number | null
          franchise_id?: string | null
          fumbles_lost?: number | null
          game_id?: string
          kickoff_return_yards?: number | null
          kickoff_returns?: number | null
          opponent_abbr?: string | null
          passing_2pt_conversions?: number | null
          passing_air_yards?: number | null
          passing_cpoe?: number | null
          passing_epa?: number | null
          passing_first_downs?: number | null
          passing_interceptions?: number | null
          passing_tds?: number | null
          passing_yards?: number | null
          passing_yards_after_catch?: number | null
          pat_att?: number | null
          pat_made?: number | null
          player_id?: string
          position?: string | null
          punt_return_yards?: number | null
          punt_returns?: number | null
          punt_yards?: number | null
          punts?: number | null
          punts_inside_20?: number | null
          receiving_2pt_conversions?: number | null
          receiving_air_yards?: number | null
          receiving_epa?: number | null
          receiving_first_downs?: number | null
          receiving_tds?: number | null
          receiving_yards?: number | null
          receiving_yards_after_catch?: number | null
          receptions?: number | null
          rushing_2pt_conversions?: number | null
          rushing_epa?: number | null
          rushing_first_downs?: number | null
          rushing_tds?: number | null
          rushing_yards?: number | null
          sack_yards_lost?: number | null
          sacks_suffered?: number | null
          season?: number
          season_type?: string
          special_teams_tds?: number | null
          sync_run_id?: number | null
          targets?: number | null
          team_abbr?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_game_stats_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_game_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_game_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_game_stats_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      player_seasons: {
        Row: {
          depth_chart_position: string | null
          franchise_id: string | null
          jersey_number: number | null
          player_id: string
          position: string | null
          season: number
          status: string | null
          sync_run_id: number | null
          team_abbr: string
          years_exp: number | null
        }
        Insert: {
          depth_chart_position?: string | null
          franchise_id?: string | null
          jersey_number?: number | null
          player_id: string
          position?: string | null
          season: number
          status?: string | null
          sync_run_id?: number | null
          team_abbr: string
          years_exp?: number | null
        }
        Update: {
          depth_chart_position?: string | null
          franchise_id?: string | null
          jersey_number?: number | null
          player_id?: string
          position?: string | null
          season?: number
          status?: string | null
          sync_run_id?: number | null
          team_abbr?: string
          years_exp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_seasons_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_seasons_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_seasons_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          all_pro_count: number | null
          birth_date: string | null
          career_av: number | null
          college: string | null
          current_franchise_id: string | null
          display_name: string
          draft_franchise_id: string | null
          draft_pick: number | null
          draft_round: number | null
          draft_season: number | null
          espn_id: string | null
          first_name: string | null
          first_season: number | null
          football_name: string | null
          gsis_id: string | null
          headshot_url: string | null
          height_in: number | null
          hof_class: number | null
          id: string
          is_hof: boolean
          jersey_number: number | null
          last_name: string | null
          last_season: number | null
          otc_id: string | null
          pff_id: string | null
          pfr_id: string | null
          position: string | null
          position_group: string | null
          pro_bowl_count: number | null
          roster_status: string | null
          seasons_played: number | null
          suffix: string | null
          sync_run_id: number | null
          weight_lb: number | null
          years_exp: number | null
        }
        Insert: {
          all_pro_count?: number | null
          birth_date?: string | null
          career_av?: number | null
          college?: string | null
          current_franchise_id?: string | null
          display_name: string
          draft_franchise_id?: string | null
          draft_pick?: number | null
          draft_round?: number | null
          draft_season?: number | null
          espn_id?: string | null
          first_name?: string | null
          first_season?: number | null
          football_name?: string | null
          gsis_id?: string | null
          headshot_url?: string | null
          height_in?: number | null
          hof_class?: number | null
          id: string
          is_hof?: boolean
          jersey_number?: number | null
          last_name?: string | null
          last_season?: number | null
          otc_id?: string | null
          pff_id?: string | null
          pfr_id?: string | null
          position?: string | null
          position_group?: string | null
          pro_bowl_count?: number | null
          roster_status?: string | null
          seasons_played?: number | null
          suffix?: string | null
          sync_run_id?: number | null
          weight_lb?: number | null
          years_exp?: number | null
        }
        Update: {
          all_pro_count?: number | null
          birth_date?: string | null
          career_av?: number | null
          college?: string | null
          current_franchise_id?: string | null
          display_name?: string
          draft_franchise_id?: string | null
          draft_pick?: number | null
          draft_round?: number | null
          draft_season?: number | null
          espn_id?: string | null
          first_name?: string | null
          first_season?: number | null
          football_name?: string | null
          gsis_id?: string | null
          headshot_url?: string | null
          height_in?: number | null
          hof_class?: number | null
          id?: string
          is_hof?: boolean
          jersey_number?: number | null
          last_name?: string | null
          last_season?: number | null
          otc_id?: string | null
          pff_id?: string | null
          pfr_id?: string | null
          position?: string | null
          position_group?: string | null
          pro_bowl_count?: number | null
          roster_status?: string | null
          seasons_played?: number | null
          suffix?: string | null
          sync_run_id?: number | null
          weight_lb?: number | null
          years_exp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_current_franchise_id_fkey"
            columns: ["current_franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_draft_franchise_id_fkey"
            columns: ["draft_franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      super_bowls: {
        Row: {
          city: string | null
          game_id: string | null
          loser_franchise_id: string
          loser_name: string
          loser_score: number
          mvp_franchise_id: string | null
          mvp_name: string | null
          mvp_position: string | null
          number: number
          played_on: string
          roman: string
          season: number
          state: string | null
          sync_run_id: number | null
          venue_name: string
          winner_franchise_id: string
          winner_name: string
          winner_score: number
        }
        Insert: {
          city?: string | null
          game_id?: string | null
          loser_franchise_id: string
          loser_name: string
          loser_score: number
          mvp_franchise_id?: string | null
          mvp_name?: string | null
          mvp_position?: string | null
          number: number
          played_on: string
          roman: string
          season: number
          state?: string | null
          sync_run_id?: number | null
          venue_name: string
          winner_franchise_id: string
          winner_name: string
          winner_score: number
        }
        Update: {
          city?: string | null
          game_id?: string | null
          loser_franchise_id?: string
          loser_name?: string
          loser_score?: number
          mvp_franchise_id?: string | null
          mvp_name?: string | null
          mvp_position?: string | null
          number?: number
          played_on?: string
          roman?: string
          season?: number
          state?: string | null
          sync_run_id?: number | null
          venue_name?: string
          winner_franchise_id?: string
          winner_name?: string
          winner_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "super_bowls_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_bowls_loser_franchise_id_fkey"
            columns: ["loser_franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_bowls_mvp_franchise_id_fkey"
            columns: ["mvp_franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_bowls_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_bowls_winner_franchise_id_fkey"
            columns: ["winner_franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          datasets: string[]
          error: string | null
          finished_at: string | null
          id: number
          row_counts: Json
          seasons: number[] | null
          started_at: string
          status: string
          trigger: string
        }
        Insert: {
          datasets: string[]
          error?: string | null
          finished_at?: string | null
          id?: never
          row_counts?: Json
          seasons?: number[] | null
          started_at?: string
          status?: string
          trigger: string
        }
        Update: {
          datasets?: string[]
          error?: string | null
          finished_at?: string | null
          id?: never
          row_counts?: Json
          seasons?: number[] | null
          started_at?: string
          status?: string
          trigger?: string
        }
        Relationships: []
      }
      team_abbrs: {
        Row: {
          abbr: string
          end_season: number
          franchise_id: string | null
          name: string
          start_season: number
          sync_run_id: number | null
        }
        Insert: {
          abbr: string
          end_season: number
          franchise_id?: string | null
          name: string
          start_season: number
          sync_run_id?: number | null
        }
        Update: {
          abbr?: string
          end_season?: number
          franchise_id?: string | null
          name?: string
          start_season?: number
          sync_run_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_abbrs_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_abbrs_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      team_divisions: {
        Row: {
          division_id: string
          end_season: number | null
          franchise_id: string
          start_season: number
          sync_run_id: number | null
        }
        Insert: {
          division_id: string
          end_season?: number | null
          franchise_id: string
          start_season: number
          sync_run_id?: number | null
        }
        Update: {
          division_id?: string
          end_season?: number | null
          franchise_id?: string
          start_season?: number
          sync_run_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_divisions_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_divisions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_divisions_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      team_game_stats: {
        Row: {
          attempts: number | null
          carries: number | null
          completions: number | null
          def_fumbles_forced: number | null
          def_interceptions: number | null
          def_pass_defended: number | null
          def_qb_hits: number | null
          def_sacks: number | null
          def_safeties: number | null
          def_tackles_for_loss: number | null
          def_tds: number | null
          fg_att: number | null
          fg_made: number | null
          franchise_id: string | null
          fumbles_lost: number | null
          fumbles_total: number | null
          game_id: string
          kickoff_return_yards: number | null
          kickoff_returns: number | null
          opponent_abbr: string | null
          passing_air_yards: number | null
          passing_cpoe: number | null
          passing_epa: number | null
          passing_first_downs: number | null
          passing_interceptions: number | null
          passing_tds: number | null
          passing_yards: number | null
          pat_att: number | null
          pat_made: number | null
          penalties: number | null
          penalty_yards: number | null
          punt_return_yards: number | null
          punt_returns: number | null
          punt_yards: number | null
          punts: number | null
          receptions: number | null
          rushing_epa: number | null
          rushing_first_downs: number | null
          rushing_tds: number | null
          rushing_yards: number | null
          sack_yards_lost: number | null
          sacks_suffered: number | null
          season: number
          season_type: string
          special_teams_tds: number | null
          sync_run_id: number | null
          targets: number | null
          team_abbr: string
          week: number
        }
        Insert: {
          attempts?: number | null
          carries?: number | null
          completions?: number | null
          def_fumbles_forced?: number | null
          def_interceptions?: number | null
          def_pass_defended?: number | null
          def_qb_hits?: number | null
          def_sacks?: number | null
          def_safeties?: number | null
          def_tackles_for_loss?: number | null
          def_tds?: number | null
          fg_att?: number | null
          fg_made?: number | null
          franchise_id?: string | null
          fumbles_lost?: number | null
          fumbles_total?: number | null
          game_id: string
          kickoff_return_yards?: number | null
          kickoff_returns?: number | null
          opponent_abbr?: string | null
          passing_air_yards?: number | null
          passing_cpoe?: number | null
          passing_epa?: number | null
          passing_first_downs?: number | null
          passing_interceptions?: number | null
          passing_tds?: number | null
          passing_yards?: number | null
          pat_att?: number | null
          pat_made?: number | null
          penalties?: number | null
          penalty_yards?: number | null
          punt_return_yards?: number | null
          punt_returns?: number | null
          punt_yards?: number | null
          punts?: number | null
          receptions?: number | null
          rushing_epa?: number | null
          rushing_first_downs?: number | null
          rushing_tds?: number | null
          rushing_yards?: number | null
          sack_yards_lost?: number | null
          sacks_suffered?: number | null
          season: number
          season_type: string
          special_teams_tds?: number | null
          sync_run_id?: number | null
          targets?: number | null
          team_abbr: string
          week: number
        }
        Update: {
          attempts?: number | null
          carries?: number | null
          completions?: number | null
          def_fumbles_forced?: number | null
          def_interceptions?: number | null
          def_pass_defended?: number | null
          def_qb_hits?: number | null
          def_sacks?: number | null
          def_safeties?: number | null
          def_tackles_for_loss?: number | null
          def_tds?: number | null
          fg_att?: number | null
          fg_made?: number | null
          franchise_id?: string | null
          fumbles_lost?: number | null
          fumbles_total?: number | null
          game_id?: string
          kickoff_return_yards?: number | null
          kickoff_returns?: number | null
          opponent_abbr?: string | null
          passing_air_yards?: number | null
          passing_cpoe?: number | null
          passing_epa?: number | null
          passing_first_downs?: number | null
          passing_interceptions?: number | null
          passing_tds?: number | null
          passing_yards?: number | null
          pat_att?: number | null
          pat_made?: number | null
          penalties?: number | null
          penalty_yards?: number | null
          punt_return_yards?: number | null
          punt_returns?: number | null
          punt_yards?: number | null
          punts?: number | null
          receptions?: number | null
          rushing_epa?: number | null
          rushing_first_downs?: number | null
          rushing_tds?: number | null
          rushing_yards?: number | null
          sack_yards_lost?: number | null
          sacks_suffered?: number | null
          season?: number
          season_type?: string
          special_teams_tds?: number | null
          sync_run_id?: number | null
          targets?: number | null
          team_abbr?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_game_stats_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_game_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_game_stats_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      team_seasons: {
        Row: {
          div_losses: number
          div_rank: number | null
          div_ties: number
          div_wins: number
          division_id: string | null
          franchise_id: string
          head_coach: string | null
          losses: number
          playoff_result: string | null
          playoff_seed: number | null
          points_against: number
          points_for: number
          season: number
          sync_run_id: number | null
          team_abbr: string
          team_name: string
          ties: number
          wins: number
        }
        Insert: {
          div_losses: number
          div_rank?: number | null
          div_ties: number
          div_wins: number
          division_id?: string | null
          franchise_id: string
          head_coach?: string | null
          losses: number
          playoff_result?: string | null
          playoff_seed?: number | null
          points_against: number
          points_for: number
          season: number
          sync_run_id?: number | null
          team_abbr: string
          team_name: string
          ties: number
          wins: number
        }
        Update: {
          div_losses?: number
          div_rank?: number | null
          div_ties?: number
          div_wins?: number
          division_id?: string | null
          franchise_id?: string
          head_coach?: string | null
          losses?: number
          playoff_result?: string | null
          playoff_seed?: number | null
          points_against?: number
          points_for?: number
          season?: number
          sync_run_id?: number | null
          team_abbr?: string
          team_name?: string
          ties?: number
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_seasons_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_seasons_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_seasons_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          asset_index: number
          from_abbr: string
          from_franchise_id: string | null
          pick_conditional: boolean | null
          pick_number: number | null
          pick_round: number | null
          pick_season: number | null
          player_id: string | null
          player_name: string | null
          season: number
          sync_run_id: number | null
          to_abbr: string
          to_franchise_id: string | null
          trade_date: string | null
          trade_id: number
        }
        Insert: {
          asset_index: number
          from_abbr: string
          from_franchise_id?: string | null
          pick_conditional?: boolean | null
          pick_number?: number | null
          pick_round?: number | null
          pick_season?: number | null
          player_id?: string | null
          player_name?: string | null
          season: number
          sync_run_id?: number | null
          to_abbr: string
          to_franchise_id?: string | null
          trade_date?: string | null
          trade_id: number
        }
        Update: {
          asset_index?: number
          from_abbr?: string
          from_franchise_id?: string | null
          pick_conditional?: boolean | null
          pick_number?: number | null
          pick_round?: number | null
          pick_season?: number | null
          player_id?: string | null
          player_name?: string | null
          season?: number
          sync_run_id?: number | null
          to_abbr?: string
          to_franchise_id?: string | null
          trade_date?: string | null
          trade_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "trades_from_franchise_id_fkey"
            columns: ["from_franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_to_franchise_id_fkey"
            columns: ["to_franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_tenancies: {
        Row: {
          end_season: number
          franchise_id: string
          start_season: number
          sync_run_id: number | null
          venue_id: string
        }
        Insert: {
          end_season: number
          franchise_id: string
          start_season: number
          sync_run_id?: number | null
          venue_id: string
        }
        Update: {
          end_season?: number
          franchise_id?: string
          start_season?: number
          sync_run_id?: number | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_tenancies_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_tenancies_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_tenancies_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          capacity: number | null
          city: string | null
          country: string | null
          id: string
          image_credit: string | null
          image_license: string | null
          image_source_url: string | null
          image_thumb_url: string | null
          image_url: string | null
          kind: string
          lat: number | null
          lng: number | null
          name: string
          names: Json
          opened_year: number | null
          region: string | null
          roof: string | null
          summary: string | null
          surface: string | null
          sync_run_id: number | null
          wikidata_id: string | null
          wikipedia_title: string | null
        }
        Insert: {
          capacity?: number | null
          city?: string | null
          country?: string | null
          id: string
          image_credit?: string | null
          image_license?: string | null
          image_source_url?: string | null
          image_thumb_url?: string | null
          image_url?: string | null
          kind: string
          lat?: number | null
          lng?: number | null
          name: string
          names?: Json
          opened_year?: number | null
          region?: string | null
          roof?: string | null
          summary?: string | null
          surface?: string | null
          sync_run_id?: number | null
          wikidata_id?: string | null
          wikipedia_title?: string | null
        }
        Update: {
          capacity?: number | null
          city?: string | null
          country?: string | null
          id?: string
          image_credit?: string | null
          image_license?: string | null
          image_source_url?: string | null
          image_thumb_url?: string | null
          image_url?: string | null
          kind?: string
          lat?: number | null
          lng?: number | null
          name?: string
          names?: Json
          opened_year?: number | null
          region?: string | null
          roof?: string | null
          summary?: string | null
          surface?: string | null
          sync_run_id?: number | null
          wikidata_id?: string | null
          wikipedia_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      franchise_players: {
        Row: {
          all_pro_count: number | null
          career_av: number | null
          display_name: string | null
          first_season: number | null
          franchise_id: string | null
          headshot_url: string | null
          hof_class: number | null
          is_hof: boolean | null
          last_season: number | null
          player_id: string | null
          position: string | null
          position_group: string | null
          pro_bowl_count: number | null
          seasons: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_seasons_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_seasons_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_season_snaps: {
        Row: {
          avg_defense_pct: number | null
          avg_offense_pct: number | null
          avg_st_pct: number | null
          defense_snaps: number | null
          games: number | null
          offense_snaps: number | null
          player_id: string | null
          season: number | null
          st_snaps: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_game_snaps_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_season_stats: {
        Row: {
          attempts: number | null
          carries: number | null
          completions: number | null
          def_fumbles_forced: number | null
          def_interceptions: number | null
          def_pass_defended: number | null
          def_qb_hits: number | null
          def_sacks: number | null
          def_safeties: number | null
          def_tackle_assists: number | null
          def_tackles_for_loss: number | null
          def_tackles_solo: number | null
          def_tds: number | null
          fg_att: number | null
          fg_long: number | null
          fg_made: number | null
          fg_made_50_plus: number | null
          franchise_ids: string[] | null
          fumbles_lost: number | null
          games: number | null
          kickoff_return_yards: number | null
          kickoff_returns: number | null
          last_franchise_id: string | null
          passing_2pt_conversions: number | null
          passing_air_yards: number | null
          passing_cpoe: number | null
          passing_epa: number | null
          passing_first_downs: number | null
          passing_interceptions: number | null
          passing_tds: number | null
          passing_yards: number | null
          passing_yards_after_catch: number | null
          pat_att: number | null
          pat_made: number | null
          player_id: string | null
          punt_return_yards: number | null
          punt_returns: number | null
          punt_yards: number | null
          punts: number | null
          punts_inside_20: number | null
          receiving_2pt_conversions: number | null
          receiving_air_yards: number | null
          receiving_epa: number | null
          receiving_first_downs: number | null
          receiving_tds: number | null
          receiving_yards: number | null
          receiving_yards_after_catch: number | null
          receptions: number | null
          rushing_2pt_conversions: number | null
          rushing_epa: number | null
          rushing_first_downs: number | null
          rushing_tds: number | null
          rushing_yards: number | null
          sack_yards_lost: number | null
          sacks_suffered: number | null
          season: number | null
          season_type: string | null
          special_teams_tds: number | null
          targets: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_game_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
