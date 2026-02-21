import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error
import joblib
import requests
from typing import List, Dict, Tuple
import warnings
warnings.filterwarnings('ignore')

class FPLMLModel:
    def __init__(self):
        self.base_url = 'https://fantasy.premierleague.com/api/'
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.target_column = 'total_points'
        self.is_trained = False
        
    def fetch_player_data(self) -> pd.DataFrame:
        """Fetch current player data from FPL API"""
        try:
            # Get bootstrap data
            response = requests.get(f'{self.base_url}bootstrap-static/')
            response.raise_for_status()
            data = response.json()
            
            # Extract players, teams, and positions
            players = data['elements']
            teams = {team['id']: team['name'] for team in data['teams']}
            positions = {pos['id']: pos['singular_name_short'] for pos in data['element_types']}
            
            # Convert to DataFrame
            df = pd.DataFrame(players)
            
            # Add team and position names
            df['team_name'] = df['team'].map(teams)
            df['position'] = df['element_type'].map(positions)
            
            # Convert price to float (in millions)
            df['price'] = df['now_cost'] / 10.0
            
            return df
            
        except Exception as e:
            print(f"Error fetching data: {e}")
            return pd.DataFrame()
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Engineer features for ML model"""
        try:
            # Create feature DataFrame
            features = df.copy()
            
            print(f"🔍 Starting feature engineering with {len(features)} players")
            print(f"📊 Available columns: {list(features.columns)}")
            
            # Basic numerical features
            numerical_features = [
                'price', 'form', 'points_per_game', 'selected_by_percent',
                'minutes', 'goals_scored', 'assists', 'clean_sheets',
                'goals_conceded', 'bonus', 'bps', 'influence', 'creativity', 'threat',
                'ict_index', 'starts', 'dreamteam_count'
            ]
            
            # Filter to available columns
            available_features = [col for col in numerical_features if col in features.columns]
            print(f"🎯 Using numerical features: {available_features}")
            
            # Keep all necessary columns for later use
            features = features[available_features + ['id', 'first_name', 'second_name', 'team_name', 'position', 'total_points']]
            
            # Convert numerical columns to float and handle missing values
            for col in available_features:
                if col in features.columns:
                    print(f"🔄 Converting {col} to numeric...")
                    # Convert to numeric, coercing errors to NaN
                    features[col] = pd.to_numeric(features[col], errors='coerce')
                    # Fill NaN with 0
                    features[col] = features[col].fillna(0)
                    print(f"✅ {col}: {features[col].dtype}, range: {features[col].min():.2f} to {features[col].max():.2f}")
            
            # Handle missing values for target column
            print("🔄 Converting total_points to numeric...")
            features['total_points'] = pd.to_numeric(features['total_points'], errors='coerce').fillna(0)
            print(f"✅ total_points: {features['total_points'].dtype}, range: {features['total_points'].min():.2f} to {features['total_points'].max():.2f}")
            
            # Encode categorical variables
            if 'team_name' in features.columns:
                print("🔄 Encoding team names...")
                le_team = LabelEncoder()
                features['team_encoded'] = le_team.fit_transform(features['team_name'].astype(str))
                self.label_encoders['team'] = le_team
                print(f"✅ Encoded {len(le_team.classes_)} teams")
                
            if 'position' in features.columns:
                print("🔄 Encoding positions...")
                le_pos = LabelEncoder()
                features['position_encoded'] = le_pos.fit_transform(features['position'].astype(str))
                self.label_encoders['position'] = le_pos
                print(f"✅ Encoded {len(le_pos.classes_)} positions")
            
            # Create interaction features (ensure they're numeric)
            if 'form' in features.columns and 'points_per_game' in features.columns:
                print("🔄 Creating form_ppg_ratio...")
                features['form_ppg_ratio'] = features['form'] / (features['points_per_game'] + 0.1)
                print(f"✅ form_ppg_ratio: {features['form_ppg_ratio'].dtype}, range: {features['form_ppg_ratio'].min():.2f} to {features['form_ppg_ratio'].max():.2f}")
            
            if 'goals_scored' in features.columns and 'assists' in features.columns:
                print("🔄 Creating goal_involvements...")
                features['goal_involvements'] = features['goals_scored'] + features['assists']
                print(f"✅ goal_involvements: {features['goal_involvements'].dtype}, range: {features['goal_involvements'].min():.2f} to {features['goal_involvements'].max():.2f}")
            
            # Select final feature columns (for ML training)
            feature_cols = [col for col in features.columns if col not in ['id', 'first_name', 'second_name', 'team_name', 'position', 'total_points']]
            self.feature_columns = feature_cols
            
            print(f"🎯 Final feature columns: {feature_cols}")
            print(f"📊 Feature matrix shape: {features[feature_cols].shape}")
            print(f"🎯 Target shape: {features['total_points'].shape}")
            
            return features  # Return full DataFrame with all columns
            
        except Exception as e:
            print(f"❌ Error in feature engineering: {e}")
            print(f"🔍 DataFrame info:")
            print(f"   Shape: {df.shape}")
            print(f"   Columns: {list(df.columns)}")
            print(f"   Dtypes: {df.dtypes}")
            raise e
    
    def train_model(self, df: pd.DataFrame) -> Dict:
        """Train XGBoost model on player data"""
        try:
            print(f"🚀 Starting model training...")
            print(f"📊 Input DataFrame shape: {df.shape}")
            print(f"🎯 Target column: {self.target_column}")
            print(f"🔧 Feature columns: {self.feature_columns}")
            
            # Prepare features and target
            X = df[self.feature_columns]
            y = df[self.target_column]
            
            print(f"📈 Features shape: {X.shape}")
            print(f"🎯 Target shape: {y.shape}")
            print(f"🔍 Feature dtypes: {X.dtypes}")
            print(f"🎯 Target dtype: {y.dtype}")
            
            # Check for any remaining non-numeric data
            for col in X.columns:
                if not pd.api.types.is_numeric_dtype(X[col]):
                    print(f"⚠️ Warning: Column {col} is not numeric: {X[col].dtype}")
                    print(f"   Sample values: {X[col].head()}")
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            print(f"✂️ Split complete - Train: {X_train.shape}, Test: {X_test.shape}")
            
            # Scale features
            print("⚖️ Scaling features...")
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            print(f"✅ Features scaled successfully")
            
            # Initialize and train XGBoost model
            print("🤖 Initializing XGBoost model...")
            self.model = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42,
                objective='reg:squarederror'
            )
            
            print("🏋️ Training XGBoost model...")
            self.model.fit(X_train_scaled, y_train)
            print("✅ Model training complete!")
            
            # Make predictions
            print("🔮 Making predictions...")
            y_pred = self.model.predict(X_test_scaled)
            print(f"✅ Predictions complete: {len(y_pred)} predictions")
            
            # Calculate metrics
            mse = mean_squared_error(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            
            print(f"📊 Training metrics:")
            print(f"   MSE: {mse:.2f}")
            print(f"   MAE: {mae:.2f}")
            print(f"   RMSE: {np.sqrt(mse):.2f}")
            
            self.is_trained = True
            
            return {
                'success': True,
                'mse': mse,
                'mae': mae,
                'rmse': np.sqrt(mse),
                'feature_importance': dict(zip(self.feature_columns, self.model.feature_importances_))
            }
            
        except Exception as e:
            print(f"❌ Error in model training: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
    
    def predict_player_points(self, df: pd.DataFrame) -> pd.DataFrame:
        """Predict points for all players"""
        if self.model is None:
            raise Exception("Model not trained. Call train_model() first.")
        
        # Prepare features for prediction
        X = df[self.feature_columns]
        X_scaled = self.scaler.transform(X)
        
        # Make predictions
        predictions = self.model.predict(X_scaled)
        
        # Add predictions to DataFrame
        result_df = df.copy()
        result_df['predicted_points'] = predictions
        
        return result_df
    
    def get_all_players_with_predictions(self) -> List[Dict]:
        """Get all players with ML predictions"""
        try:
            # Fetch data
            df = self.fetch_player_data()
            if df.empty:
                return []
            
            # Engineer features
            features_df = self.engineer_features(df)
            
            # Get predictions
            predictions_df = self.predict_player_points(features_df)
            
            # Convert to list of dictionaries
            players = []
            for _, player in predictions_df.iterrows():
                players.append({
                    'id': int(player['id']),
                    'name': f"{player['first_name']} {player['second_name']}",
                    'team': player['team_name'],
                    'position': player['position'],
                    'price': float(player['price']),
                    'predicted_points': float(player['predicted_points']),
                    'actual_points': int(player['total_points']),
                    'form': float(player['form']),
                    'points_per_game': float(player['points_per_game']),
                    'selected_by_percent': float(player['selected_by_percent']),
                    'minutes': int(player['minutes']),
                    'goals_scored': int(player['goals_scored']),
                    'assists': int(player['assists']),
                    'clean_sheets': int(player['clean_sheets'])
                })
            
            # Sort by predicted points
            players.sort(key=lambda x: x['predicted_points'], reverse=True)
            
            return players
            
        except Exception as e:
            print(f"Error getting players with predictions: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def auto_train(self) -> bool:
        """Automatically train the model with current data"""
        try:
            print("🤖 Starting automatic ML model training...")
            
            # Fetch data
            print("📡 Fetching player data from FPL API...")
            df = self.fetch_player_data()
            if df.empty:
                print("❌ No data available for training")
                return False
            
            print(f"✅ Fetched {len(df)} players from FPL API")
            print(f"📊 Data columns: {list(df.columns)}")
            
            # Engineer features
            print("🔧 Engineering features...")
            features_df = self.engineer_features(df)
            print(f"✅ Feature engineering complete: {features_df.shape}")
            
            # Train model
            print("🏋️ Starting model training...")
            result = self.train_model(features_df)
            
            if result['success']:
                print(f"✅ Model trained successfully! RMSE: {result['rmse']:.2f}")
                # Save model
                print("💾 Saving trained model...")
                self.save_model()
                print("✅ Model saved successfully!")
                return True
            else:
                print(f"❌ Training failed: {result.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            print(f"❌ Auto-training error: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def save_model(self, filepath: str = 'fpl_xgboost_model.pkl'):
        """Save the trained model"""
        if self.model is not None:
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'label_encoders': self.label_encoders,
                'feature_columns': self.feature_columns
            }
            joblib.dump(model_data, filepath)
            return True
        return False
    
    def load_model(self, filepath: str = 'fpl_xgboost_model.pkl'):
        """Load a trained model"""
        try:
            model_data = joblib.load(filepath)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.label_encoders = model_data['label_encoders']
            self.feature_columns = model_data['feature_columns']
            self.is_trained = True
            return True
        except:
            return False

    def _compute_team_fixture_difficulty(self, window_size: int = 5) -> Dict[str, float]:
        """Compute average upcoming fixture difficulty per team over next N gameweeks."""
        try:
            # Fetch bootstrap for events and teams
            bootstrap_resp = requests.get(f"{self.base_url}bootstrap-static/")
            bootstrap_resp.raise_for_status()
            bootstrap = bootstrap_resp.json()

            # Map team id to team name
            team_id_to_name = {team['id']: team['name'] for team in bootstrap.get('teams', [])}

            # Determine current or next event
            current_event = None
            for ev in bootstrap.get('events', []):
                if ev.get('is_current'):
                    current_event = ev.get('id')
                    break
            if current_event is None:
                for ev in bootstrap.get('events', []):
                    if ev.get('is_next'):
                        current_event = ev.get('id')
                        break

            # Fetch fixtures
            fixtures_resp = requests.get(f"{self.base_url}fixtures/")
            fixtures_resp.raise_for_status()
            fixtures = fixtures_resp.json()

            # Fallback if current_event not found
            if current_event is None:
                events = [fx.get('event') for fx in fixtures if fx.get('event')]
                current_event = min(events) if events else 1

            # Boundaries
            start_event = int(current_event)
            end_event = start_event + max(0, int(window_size) - 1)

            # Collect difficulties per team id
            team_diffs: Dict[int, list] = {}
            for fx in fixtures:
                ev = fx.get('event')
                if ev is None or ev < start_event or ev > end_event:
                    continue
                home_id = fx.get('team_h')
                away_id = fx.get('team_a')
                home_diff = fx.get('team_h_difficulty')
                away_diff = fx.get('team_a_difficulty')
                if home_id:
                    team_diffs.setdefault(home_id, []).append(home_diff)
                if away_id:
                    team_diffs.setdefault(away_id, []).append(away_diff)

            # Average and map to names
            team_avg: Dict[str, float] = {}
            for tid, diffs in team_diffs.items():
                if not diffs:
                    continue
                name = team_id_to_name.get(tid)
                if not name:
                    continue
                team_avg[name] = float(np.mean(diffs))

            return team_avg
        except Exception as e:
            print(f"⚠️ Failed to compute fixture difficulty: {e}")
            return {}

    @staticmethod
    def _compute_fixture_factor(avg_difficulty: float, weight: float) -> float:
        """Convert average difficulty (1 easy .. 5 hard) to a multiplier.
        Factor is centered at 1.0 for difficulty=3, scaled by weight, and clamped to [0.8, 1.2].
        """
        try:
            if avg_difficulty is None or np.isnan(avg_difficulty):
                return 1.0
            # Easier fixtures (<3) boost, harder (>3) reduce
            factor = 1.0 + (3.0 - float(avg_difficulty)) * float(weight)
            return float(max(0.8, min(1.2, factor)))
        except Exception:
            return 1.0

    def create_best_team(self, budget: float = 100.0, fixture_window: int = 5, fixture_weight: float = 0.15) -> Dict:
        """Create the best possible FPL team with 15 players"""
        try:
            print(f"🏆 Creating best FPL team with £{budget}M budget...")
            print(f"📅 Fixture window: next {fixture_window} GWs | 🎚️ Fixture weight: {fixture_weight}")
            
            # Get all players with predictions
            players = self.get_all_players_with_predictions()
            if not players:
                return {'success': False, 'error': 'No players available'}
            
            print(f"📊 Analyzing {len(players)} players for team selection...")

            # Compute team fixture difficulties and factors
            team_fixture_avg = self._compute_team_fixture_difficulty(window_size=fixture_window)
            
            # Attach fixture-adjusted predictions to each player
            enriched_players = []
            for p in players:
                avg_diff = team_fixture_avg.get(p['team'])
                fx_factor = self._compute_fixture_factor(avg_diff, fixture_weight)
                adjusted_pts = p['predicted_points'] * fx_factor
                enriched = dict(p)
                enriched['fixture_avg_difficulty'] = float(avg_diff) if avg_diff is not None else None
                enriched['fixture_factor'] = float(fx_factor)
                enriched['raw_predicted_points'] = float(p['predicted_points'])
                enriched['predicted_points'] = float(adjusted_pts)
                enriched_players.append(enriched)
            
            # FPL team requirements
            team_requirements = {
                'GKP': 2,    # 2 goalkeepers
                'DEF': 5,    # 5 defenders  
                'MID': 5,    # 5 midfielders
                'FWD': 3     # 3 forwards
            }
            
            # Separate players by position
            position_players = {'GKP': [], 'DEF': [], 'MID': [], 'FWD': []}
            for player in enriched_players:
                if player['position'] in position_players:
                    position_players[player['position']].append(player)
            
            # Sort each position by predicted points per million (value for money)
            for position in position_players:
                position_players[position].sort(
                    key=lambda x: (x['predicted_points'] / x['price']), 
                    reverse=True
                )
            
            # Build the team
            selected_players = []
            total_cost = 0.0
            total_predicted_points = 0.0
            total_raw_predicted_points = 0.0
            
            print("🔍 Selecting players by position...")
            
            for position, count in team_requirements.items():
                print(f"  {position}: Selecting {count} players...")
                
                available_players = position_players[position]
                if len(available_players) < count:
                    return {'success': False, 'error': f'Not enough {position} players available'}
                
                # Select best players for this position
                for i in range(count):
                    player = available_players[i]
                    
                    # Check if we can afford this player
                    if total_cost + player['price'] > budget:
                        # Find cheaper alternative
                        for alt_player in available_players[i+1:]:
                            if total_cost + alt_player['price'] <= budget:
                                player = alt_player
                                break
                        else:
                            return {'success': False, 'error': f'Cannot afford {count} {position} players within budget'}
                    
                    selected_players.append(player)
                    total_cost += player['price']
                    total_predicted_points += player['predicted_points']
                    total_raw_predicted_points += player.get('raw_predicted_points', player['predicted_points'])
                    
                    print(f"    ✅ {player['name']} ({player['team']}) - £{player['price']}M - {player['predicted_points']:.1f} pts (fx {player.get('fixture_factor',1.0):.2f}, avg diff {player.get('fixture_avg_difficulty','-')})")
            
            # Calculate team statistics
            team_stats = {
                'total_cost': total_cost,
                'budget_remaining': budget - total_cost,
                'total_predicted_points': total_predicted_points,
                'total_raw_predicted_points': total_raw_predicted_points,
                'value_for_money': total_predicted_points / total_cost if total_cost > 0 else 0,
                'formation': f"{len([p for p in selected_players if p['position'] == 'DEF'])}-{len([p for p in selected_players if p['position'] == 'MID'])}-{len([p for p in selected_players if p['position'] == 'FWD'])}"
            }
            
            # Sort selected players by predicted points
            selected_players.sort(key=lambda x: x['predicted_points'], reverse=True)
            
            print(f"🎯 Team creation complete!")
            print(f"💰 Total cost: £{total_cost:.1f}M")
            print(f"💵 Budget remaining: £{team_stats['budget_remaining']:.1f}M")
            print(f"🎯 Total predicted points: {total_predicted_points:.1f}")
            print(f"📊 Value for money: {team_stats['value_for_money']:.2f} pts/£M")
            print(f"⚽ Formation: {team_stats['formation']}")
            
            return {
                'success': True,
                'team': selected_players,
                'stats': team_stats,
                'message': f'Best team created with {len(selected_players)} players'
            }
            
        except Exception as e:
            print(f"❌ Error creating best team: {e}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': str(e)}
    
    def get_team_suggestions(self, budget: float = 100.0, num_suggestions: int = 3, fixture_window: int = 5, fixture_weight: float = 0.15) -> Dict:
        """Get multiple team suggestions with different strategies"""
        try:
            print(f"💡 Generating {num_suggestions} team suggestions...")
            
            suggestions = []
            
            # Strategy 1: Value for money (balanced approach)
            print("🎯 Strategy 1: Value for money (balanced)")
            team1 = self.create_best_team(budget, fixture_window, fixture_weight)
            if team1['success']:
                suggestions.append({
                    'strategy': 'Value for Money (Balanced)',
                    'description': 'Balanced team focusing on points per million',
                    'team': team1['team'],
                    'stats': team1['stats']
                })
            
            # Strategy 2: Premium heavy (expensive players)
            print("💎 Strategy 2: Premium heavy")
            team2 = self._create_premium_team(budget, fixture_window, fixture_weight)
            if team2['success']:
                suggestions.append({
                    'strategy': 'Premium Heavy',
                    'description': 'Team with expensive, high-scoring players',
                    'team': team2['team'],
                    'stats': team2['stats']
                })
            
            # Strategy 3: Budget friendly
            print("💰 Strategy 3: Budget friendly")
            team3 = self._create_budget_team(budget, fixture_window, fixture_weight)
            if team3['success']:
                suggestions.append({
                    'strategy': 'Budget Friendly',
                    'description': 'Team maximizing value with cheaper players',
                    'team': team3['team'],
                    'stats': team3['stats']
                })
            
            return {
                'success': True,
                'suggestions': suggestions,
                'message': f'Generated {len(suggestions)} team suggestions'
            }
            
        except Exception as e:
            print(f"❌ Error generating team suggestions: {e}")
            return {'success': False, 'error': str(e)}
    
    def _create_premium_team(self, budget: float, fixture_window: int = 5, fixture_weight: float = 0.15) -> Dict:
        """Create team with expensive, high-scoring players"""
        try:
            players = self.get_all_players_with_predictions()
            if not players:
                return {'success': False, 'error': 'No players available'}
            
            # Adjust by fixture difficulty
            team_fixture_avg = self._compute_team_fixture_difficulty(window_size=fixture_window)
            enriched = []
            for p in players:
                avg_diff = team_fixture_avg.get(p['team'])
                fx_factor = self._compute_fixture_factor(avg_diff, fixture_weight)
                q = dict(p)
                q['fixture_avg_difficulty'] = float(avg_diff) if avg_diff is not None else None
                q['fixture_factor'] = float(fx_factor)
                q['raw_predicted_points'] = float(p['predicted_points'])
                q['predicted_points'] = float(p['predicted_points'] * fx_factor)
                enriched.append(q)

            # Sort by adjusted predicted points (highest first)
            enriched.sort(key=lambda x: x['predicted_points'], reverse=True)
            
            team_requirements = {'GKP': 2, 'DEF': 5, 'MID': 5, 'FWD': 3}
            selected_players = []
            total_cost = 0.0
            total_predicted_points = 0.0
            total_raw_predicted_points = 0.0
            
            for position, count in team_requirements.items():
                position_players = [p for p in enriched if p['position'] == position]
                for i in range(count):
                    if i < len(position_players):
                        player = position_players[i]
                        if total_cost + player['price'] <= budget:
                            selected_players.append(player)
                            total_cost += player['price']
                            total_predicted_points += player['predicted_points']
                            total_raw_predicted_points += player.get('raw_predicted_points', player['predicted_points'])
            
            if len(selected_players) == 15:
                return {
                    'success': True,
                    'team': selected_players,
                    'stats': {
                        'total_cost': total_cost,
                        'budget_remaining': budget - total_cost,
                        'total_predicted_points': total_predicted_points,
                        'total_raw_predicted_points': total_raw_predicted_points,
                        'value_for_money': total_predicted_points / total_cost if total_cost > 0 else 0
                    }
                }
            
            return {'success': False, 'error': 'Could not create premium team within budget'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _create_budget_team(self, budget: float, fixture_window: int = 5, fixture_weight: float = 0.15) -> Dict:
        """Create team maximizing value with cheaper players"""
        try:
            players = self.get_all_players_with_predictions()
            if not players:
                return {'success': False, 'error': 'No players available'}
            
            # Adjust by fixture difficulty
            team_fixture_avg = self._compute_team_fixture_difficulty(window_size=fixture_window)
            enriched = []
            for p in players:
                avg_diff = team_fixture_avg.get(p['team'])
                fx_factor = self._compute_fixture_factor(avg_diff, fixture_weight)
                q = dict(p)
                q['fixture_avg_difficulty'] = float(avg_diff) if avg_diff is not None else None
                q['fixture_factor'] = float(fx_factor)
                q['raw_predicted_points'] = float(p['predicted_points'])
                q['predicted_points'] = float(p['predicted_points'] * fx_factor)
                enriched.append(q)
            
            # Sort by value for money using adjusted predictions
            enriched.sort(key=lambda x: ((x['predicted_points'] / x['price']) if x['price'] else 0.0), reverse=True)
            
            team_requirements = {'GKP': 2, 'DEF': 5, 'MID': 5, 'FWD': 3}
            selected_players = []
            total_cost = 0.0
            total_predicted_points = 0.0
            total_raw_predicted_points = 0.0
            
            for position, count in team_requirements.items():
                position_players = [p for p in enriched if p['position'] == position]
                for i in range(count):
                    if i < len(position_players):
                        player = position_players[i]
                        if total_cost + player['price'] <= budget:
                            selected_players.append(player)
                            total_cost += player['price']
                            total_predicted_points += player['predicted_points']
                            total_raw_predicted_points += player.get('raw_predicted_points', player['predicted_points'])
            
            if len(selected_players) == 15:
                return {
                    'success': True,
                    'team': selected_players,
                    'stats': {
                        'total_cost': total_cost,
                        'budget_remaining': budget - total_cost,
                        'total_predicted_points': total_predicted_points,
                        'total_raw_predicted_points': total_raw_predicted_points,
                        'value_for_money': total_predicted_points / total_cost if total_cost > 0 else 0
                    }
                }
            
            return {'success': False, 'error': 'Could not create budget team within budget'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
