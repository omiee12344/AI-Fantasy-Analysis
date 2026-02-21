// AI Player Analyzer - Frontend Implementation
// This replaces the need for a Flask backend

export interface PlayerComparisonData {
  name: string;
  position: string;
  team: string;
  price: number;
  total_points: number;
  form: number;
  points_per_game: number;
  selected_by_percent: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  value_ratio?: number;
  consistency?: number;
}

export interface AIAnalysisResult {
  summary: string;
  detailed_analysis: string;
  recommendations: string;
  metrics_comparison: {
    points: { player1: number; player2: number; difference: number; winner: string };
    form: { player1: number; player2: number; difference: number; winner: string };
    value_ratio: { player1: number; player2: number; difference: number; winner: string };
    consistency: { player1: number; player2: number; difference: number; winner: string };
  };
  position_specific: string;
}

export interface IndividualPlayerData {
  name: string;
  position: string;
  team: string;
  price: number;
  form: number;
  points_per_game: number;
  total_points: number;
  selected_by_percent: number;
  recent_average_points: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  ict_index: number;
}

export interface IndividualPlayerAnalysis {
  overview: string;
  form_analysis: string;
  value_assessment: string;
  position_insights: string;
  strategic_recommendations: string;
  key_metrics: {
    value_rating: string;
    form_trend: string;
    ownership_status: string;
    consistency_level: string;
  };
}

export class AIPlayerAnalyzer {
  private static analysisTemplates = {
    summary: [
      "Based on my analysis of the data, {winner} emerges as the stronger performer overall.",
      "Looking at the numbers, {winner} has a clear edge in this comparison.",
      "After crunching the stats, {winner} comes out on top in most key metrics.",
      "The data suggests {winner} is performing at a higher level right now.",
      "From what I can see, {winner} has been more consistent and effective.",
      "My analysis points to {winner} as the better choice based on current form and value.",
      "When I evaluate all the factors, {winner} stands out as the superior option.",
      "The statistics clearly favor {winner} in this head-to-head matchup."
    ],
    
    seasonPerformance: [
      "In terms of season-long performance, {better_player} has been more reliable, scoring {points_diff} more points overall.",
      "Looking at the bigger picture, {better_player} has accumulated {points_diff} more points this season, showing better consistency.",
      "Season performance favors {better_player}, who has {points_diff} more points to their name.",
      "Over the course of the season, {better_player} has been more productive with {points_diff} additional points.",
      "The season statistics tell us that {better_player} has been more effective, leading by {points_diff} points.",
      "When we look at the full season, {better_player} has outperformed with {points_diff} more points scored."
    ],
    
    formAnalysis: [
      "Recent form is crucial, and {better_form} has been in better shape lately with a {form_diff} point advantage.",
      "Current momentum favors {better_form}, who's been performing {form_diff} points better in recent games.",
      "Looking at recent performances, {better_form} has been the more in-form player with {form_diff} better form.",
      "Recent form analysis shows {better_form} is hitting their stride, leading by {form_diff} points.",
      "The form guide indicates {better_form} is currently in better shape, with {form_diff} points more in recent matches.",
      "Current form suggests {better_form} is the player to watch, performing {form_diff} points better lately."
    ],
    
    valueAnalysis: [
      "Value for money is important, and {better_value} offers significantly better returns per million spent.",
      "When it comes to bang for your buck, {better_value} is the clear winner in this comparison.",
      "Value analysis reveals {better_value} as the more cost-effective choice for your team.",
      "Looking at value metrics, {better_value} provides better returns relative to their price tag.",
      "The value proposition clearly favors {better_value} in this matchup.",
      "Cost-effectiveness analysis shows {better_value} is the smarter investment."
    ],
    
    recommendations: [
      "My recommendation would be to consider {player_name} as they offer better value and form.",
      "I'd suggest looking at {player_name} given their current performance levels.",
      "Based on the data, {player_name} appears to be the stronger option right now.",
      "My analysis suggests {player_name} could be the better pick for your team.",
      "I'd recommend {player_name} based on their recent form and value metrics.",
      "The numbers point to {player_name} as the more promising choice."
    ]
  };

  private static individualPlayerTemplates = {
    overview: [
      "Let me break down {name} for you. This {position} from {team} has been making waves with their current form and performance levels.",
      "Here's what I'm seeing with {name}. As a {position} playing for {team}, they've been delivering some interesting numbers lately.",
      "Let me give you the lowdown on {name}. This {team} {position} has been showing some promising signs this season.",
      "Here's my take on {name}. Playing as a {position} for {team}, they've been putting up some decent numbers.",
      "Let me analyze {name} for you. This {position} from {team} has been catching my attention with their recent performances.",
      "Here's what the data tells us about {name}. As a {position} for {team}, they've been showing some interesting trends."
    ],
    
    formAssessment: [
      "When it comes to recent form, {name} has been {form_description}. Their current form rating of {form} suggests {form_insight}.",
      "Looking at current form, {name} is {form_description}. With a form rating of {form}, this indicates {form_insight}.",
      "Recent form analysis shows {name} is {form_description}. Their {form} form rating tells us {form_insight}.",
      "Current form is {form_description} for {name}. The {form} rating suggests {form_insight}.",
      "Form-wise, {name} has been {form_description}. Their {form} rating indicates {form_insight}.",
      "In terms of recent form, {name} is {form_description}. This {form} rating suggests {form_insight}."
    ],
    
    valueAssessment: [
      "At £{price}m, {name} represents {value_description}. This price point suggests {value_insight}.",
      "Priced at £{price}m, {name} offers {value_description}. This valuation indicates {value_insight}.",
      "With a price tag of £{price}m, {name} provides {value_description}. This pricing suggests {value_insight}.",
      "Costing £{price}m, {name} delivers {value_description}. This cost structure indicates {value_insight}.",
      "At £{price}m, {name} gives you {value_description}. This price suggests {value_insight}.",
      "Priced at £{price}m, {name} offers {value_description}. This valuation tells us {value_insight}."
    ],
    
    positionInsights: [
      "As a {position}, {name} {position_insight}. This position typically {position_explanation}.",
      "Playing as a {position}, {name} {position_insight}. {position} players usually {position_explanation}.",
      "In the {position} role, {name} {position_insight}. This position is known for {position_explanation}.",
      "Operating as a {position}, {name} {position_insight}. The {position} position typically {position_explanation}.",
      "Functioning as a {position}, {name} {position_insight}. This role usually {position_explanation}.",
      "Serving as a {position}, {name} {position_insight}. {position} players typically {position_explanation}."
    ],
    
    strategicAdvice: [
      "My strategic advice would be to {advice}. This approach could {benefit}.",
      "I'd recommend {advice}. This strategy might {benefit}.",
      "From a strategic standpoint, {advice}. This could potentially {benefit}.",
      "My strategic thinking suggests {advice}. This approach may {benefit}.",
      "I'd advise {advice}. This strategy could {benefit}.",
      "Strategic considerations point to {advice}. This might {benefit}."
    ]
  };

  /**
   * Generate intelligent AI-powered comparison between two players
   * Based on comprehensive statistical analysis of their performance data
   */
  static comparePlayers(player1: PlayerComparisonData, player2: PlayerComparisonData): AIAnalysisResult {
    // Calculate advanced metrics
    const p1 = { ...player1 };
    const p2 = { ...player2 };
    
    p1.value_ratio = p1.points_per_game / (p1.price / 10) || 0;
    p2.value_ratio = p2.points_per_game / (p2.price / 10) || 0;
    
    p1.consistency = p1.form / p1.points_per_game || 0;
    p2.consistency = p2.form / p2.points_per_game || 0;
    
    // Generate intelligent analysis
    return {
      summary: this.generateDynamicSummary(p1, p2),
      detailed_analysis: this.generateDynamicDetailedAnalysis(p1, p2),
      recommendations: this.generateDynamicRecommendations(p1, p2),
      metrics_comparison: this.generateMetricsComparison(p1, p2),
      position_specific: this.generateDynamicPositionSpecificAnalysis(p1, p2)
    };
  }

  /**
   * Generate dynamic individual player analysis
   * Creates unique, varied descriptions for each player
   */
  static analyzeIndividualPlayer(player: IndividualPlayerData): IndividualPlayerAnalysis {
    const priceCategory = this.getPriceCategory(player.price);
    const formCategory = this.getFormCategory(player.form);
    const ownershipCategory = this.getOwnershipCategory(player.selected_by_percent);
    const valueRating = this.calculateValueRating(player.points_per_game, player.price);
    
    return {
      overview: this.generateDynamicOverview(player, priceCategory, formCategory),
      form_analysis: this.generateDynamicFormAnalysis(player, formCategory),
      value_assessment: this.generateDynamicValueAssessment(player, priceCategory, valueRating),
      position_insights: this.generateDynamicPositionInsights(player),
      strategic_recommendations: this.generateDynamicStrategicAdvice(player, priceCategory, formCategory, ownershipCategory),
      key_metrics: {
        value_rating: this.getStarRating(valueRating),
        form_trend: this.getFormTrend(player.form),
        ownership_status: this.getOwnershipStatus(player.selected_by_percent),
        consistency_level: this.getConsistencyLevel(player.form, player.points_per_game)
      }
    };
  }

  private static getPriceCategory(price: number): string {
    if (price < 6) return 'budget';
    if (price > 10) return 'premium';
    return 'mid_range';
  }

  private static getFormCategory(form: number): string {
    if (form > 6) return 'excellent';
    if (form > 4) return 'good';
    return 'poor';
  }

  private static getOwnershipCategory(tsb: number): string {
    if (tsb > 15) return 'highly owned';
    if (tsb > 5) return 'moderately owned';
    return 'lowly owned';
  }

  private static calculateValueRating(ppg: number, price: number): number {
    return ppg / (price / 10);
  }

  private static getStarRating(value: number): string {
    if (value > 0.6) return '⭐⭐⭐';
    if (value > 0.4) return '⭐⭐';
    return '⭐';
  }

  private static getFormTrend(form: number): string {
    if (form > 6) return '📈 Hot';
    if (form > 4) return '➡️ Steady';
    return '📉 Cold';
  }

  private static getOwnershipStatus(tsb: number): string {
    if (tsb > 15) return '🔥 Popular';
    if (tsb > 5) return '👥 Moderate';
    return '💎 Differential';
  }

  private static getConsistencyLevel(form: number, ppg: number): string {
    const ratio = form / ppg;
    if (ratio > 1.2) return '📊 Improving';
    if (ratio > 0.8) return '➡️ Stable';
    return '📉 Declining';
  }

  private static generateDynamicOverview(player: IndividualPlayerData, priceCategory: string, formCategory: string): string {
    const template = this.getRandomTemplate(this.individualPlayerTemplates.overview);
    return template
      .replace('{name}', player.name)
      .replace('{position}', player.position)
      .replace('{team}', player.team);
  }

  private static generateDynamicFormAnalysis(player: IndividualPlayerData, formCategory: string): string {
    const formDescriptions = {
      excellent: ['firing on all cylinders', 'in red-hot form', 'absolutely flying', 'playing out of their skin', 'in sensational form'],
      good: ['performing well', 'in decent form', 'showing good consistency', 'playing solid football', 'in reasonable form'],
      poor: ['struggling for form', 'going through a rough patch', 'finding it tough', 'not at their best', 'having a difficult time']
    };

    const formInsights = {
      excellent: 'they\'re in peak condition and could be a great differential pick',
      good: 'they\'re reliable and consistent, which is valuable in FPL',
      poor: 'they might need time to find their rhythm, so patience could be key'
    };

    // Safety check: ensure formCategory exists in our objects
    const safeFormCategory = formCategory in formDescriptions ? formCategory : 'good';
    
    const formDescription = this.getRandomTemplate(formDescriptions[safeFormCategory as keyof typeof formDescriptions]);
    const formInsight = formInsights[safeFormCategory as keyof typeof formInsights];

    const template = this.getRandomTemplate(this.individualPlayerTemplates.formAssessment);
    return template
      .replace('{name}', player.name)
      .replace('{form_description}', formDescription)
      .replace('{form}', player.form.toFixed(1))
      .replace('{form_insight}', formInsight);
  }

  private static generateDynamicValueAssessment(player: IndividualPlayerData, priceCategory: string, valueRating: number): string {
    const valueDescriptions = {
      budget: ['excellent value for money', 'a real bargain', 'fantastic value', 'a steal at this price', 'outstanding value'],
      mid_range: ['decent value', 'reasonable value', 'fair value', 'good value', 'solid value'],
      premium: ['premium value', 'high-end value', 'elite value', 'top-tier value', 'premium quality']
    };

    const valueInsights = {
      budget: 'they could be a great enabler for your team structure',
      mid_range: 'they offer a good balance of value and potential',
      premium: 'they need to deliver consistently to justify the investment'
    };

    // Safety check: ensure priceCategory exists in our objects, fallback to mid_range if not found
    const safePriceCategory = priceCategory in valueDescriptions ? priceCategory : 'mid_range';
    
    const valueDescription = this.getRandomTemplate(valueDescriptions[safePriceCategory as keyof typeof valueDescriptions]);
    const valueInsight = valueInsights[safePriceCategory as keyof typeof valueInsights];

    const template = this.getRandomTemplate(this.individualPlayerTemplates.valueAssessment);
    return template
      .replace('{name}', player.name)
      .replace('{price}', player.price.toFixed(1))
      .replace('{value_description}', valueDescription)
      .replace('{value_insight}', valueInsight);
  }

  private static generateDynamicPositionInsights(player: IndividualPlayerData): string {
    const positionInsights = {
      'Forward': {
        insight: 'needs to focus on goals and bonus points',
        explanation: 'relies heavily on attacking returns and goal-scoring opportunities'
      },
      'Midfielder': {
        insight: 'offers a good balance of attacking and defensive returns',
        explanation: 'can contribute through goals, assists, and clean sheet bonuses'
      },
      'Defender': {
        insight: 'relies on clean sheets and attacking contributions',
        explanation: 'needs defensive solidity and occasional attacking returns'
      },
      'Goalkeeper': {
        insight: 'scores primarily through saves and clean sheets',
        explanation: 'depends heavily on defensive team performance and save opportunities'
      }
    };

    // Safety check: ensure position exists in our objects, fallback to Midfielder if not found
    const posData = positionInsights[player.position as keyof typeof positionInsights] || positionInsights['Midfielder'];
    
    const template = this.getRandomTemplate(this.individualPlayerTemplates.positionInsights);
    return template
      .replace('{name}', player.name)
      .replace('{position}', player.position)
      .replace('{position_insight}', posData.insight)
      .replace('{position_explanation}', posData.explanation);
  }

  private static generateDynamicStrategicAdvice(player: IndividualPlayerData, priceCategory: string, formCategory: string, ownershipCategory: string): string {
    let advice = '';
    let benefit = '';

    if (priceCategory === 'budget' && formCategory === 'excellent') {
      advice = 'consider this player as a strong budget enabler';
      benefit = 'free up funds for premium players elsewhere while maintaining good returns';
    } else if (priceCategory === 'premium' && formCategory === 'excellent') {
      advice = 'this could be a premium player worth the investment';
      benefit = 'provide consistent high returns and captaincy options';
    } else if (ownershipCategory === 'lowly owned' && formCategory === 'good') {
      advice = 'this differential pick could be worth considering';
      benefit = 'give your team a unique edge and potential for big gains';
    } else if (formCategory === 'poor') {
      advice = 'wait and see before making a move';
      benefit = 'avoid potential losses while they find their rhythm';
    } else {
      advice = 'this player could be a solid squad option';
      benefit = 'provide reliable returns without breaking the bank';
    }

    const template = this.getRandomTemplate(this.individualPlayerTemplates.strategicAdvice);
    return template
      .replace('{advice}', advice)
      .replace('{benefit}', benefit);
  }

  private static getRandomTemplate(templates: string[]): string {
    // Safety check: if templates is undefined, null, or empty, return a default message
    if (!templates || !Array.isArray(templates) || templates.length === 0) {
      return "Analysis data is currently unavailable.";
    }
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private static generateSummary(p1: any, p2: any): string {
    // Determine overall winner based on multiple factors
    let p1_score = 0;
    let p2_score = 0;
    
    // Points scoring
    if (p1.total_points > p2.total_points) {
      p1_score += 2;
    } else if (p2.total_points > p1.total_points) {
      p2_score += 2;
    }
      
    // Form
    if (p1.form > p2.form) {
      p1_score += 2;
    } else if (p2.form > p1.form) {
      p2_score += 2;
    }
      
    // Value
    if (p1.value_ratio > p2.value_ratio) {
      p1_score += 1;
    } else if (p2.value_ratio > p1.value_ratio) {
      p2_score += 1;
    }
      
    // Consistency
    if (p1.consistency > p2.consistency) {
      p1_score += 1;
    } else if (p2.consistency > p1.consistency) {
      p2_score += 1;
    }
      
    if (p1_score > p2_score) {
      const winner = p1.name;
      const margin = Math.abs(p1_score - p2_score) <= 1 ? "slightly" : "clearly";
      return `${winner} ${margin} outperforms the other based on overall performance metrics.`;
    } else if (p2_score > p1_score) {
      const winner = p2.name;
      const margin = Math.abs(p2_score - p1_score) <= 1 ? "slightly" : "clearly";
      return `${winner} ${margin} outperforms the other based on overall performance metrics.`;
    } else {
      return "Both players perform equally based on overall performance metrics.";
    }
  }

  private static generateDetailedAnalysis(p1: any, p2: any): string {
    const analysis: string[] = [];
    
    // Points analysis
    const points_diff = Math.abs(p1.total_points - p2.total_points);
    if (points_diff > 20) {
      const better_player = p1.total_points > p2.total_points ? p1.name : p2.name;
      analysis.push(`📊 **Season Performance**: ${better_player} has scored ${points_diff} more points this season, showing significantly better consistency.`);
    } else if (points_diff > 10) {
      analysis.push(`📊 **Season Performance**: ${p1.name} leads by ${points_diff} points, indicating a moderate advantage.`);
    } else {
      analysis.push(`📊 **Season Performance**: Both players are very close in total points (${points_diff} difference), suggesting similar season-long value.`);
    }
    
    // Form analysis
    const form_diff = Math.abs(p1.form - p2.form);
    if (form_diff > 2) {
      const better_form = p1.form > p2.form ? p1.name : p2.name;
      analysis.push(`📈 **Current Form**: ${better_form} is in significantly better form (${form_diff.toFixed(1)} points difference), indicating recent momentum.`);
    } else if (form_diff > 1) {
      analysis.push(`📈 **Current Form**: ${p1.name} has slightly better recent form, though the difference is marginal.`);
    } else {
      analysis.push(`📈 **Current Form**: Both players show similar recent form levels.`);
    }
    
    // Value analysis
    const value_diff = Math.abs(p1.value_ratio - p2.value_ratio);
    if (value_diff > 0.5) {
      const better_value = p1.value_ratio > p2.value_ratio ? p1.name : p2.name;
      analysis.push(`💰 **Value for Money**: ${better_value} offers significantly better returns per million spent (${value_diff.toFixed(2)} difference).`);
    } else {
      analysis.push(`💰 **Value for Money**: Both players offer similar value relative to their price.`);
    }
    
    // Playing time analysis
    if (p1.minutes > 0 && p2.minutes > 0) {
      const minutes_diff = Math.abs(p1.minutes - p2.minutes);
      if (minutes_diff > 500) {
        const more_playing = p1.minutes > p2.minutes ? p1.name : p2.name;
        analysis.push(`⏱️ **Playing Time**: ${more_playing} has played ${Math.floor(minutes_diff / 90)} more full games, indicating better squad security.`);
      }
    }
    
    return analysis.join('\n\n');
  }

  private static generateRecommendations(p1: any, p2: any): string {
    const recommendations: string[] = [];
    
    // Price-based recommendations
    const price_diff = Math.abs(p1.price - p2.price);
    if (price_diff > 2) {
      const cheaper = p1.price < p2.price ? p1.name : p2.name;
      const more_expensive = p1.price > p2.price ? p1.name : p2.name;
      recommendations.push(`💡 **Budget Consideration**: ${cheaper} offers similar performance at £${price_diff.toFixed(1)}m less, potentially freeing up funds for other positions.`);
    }
    
    // Form-based recommendations
    if (p1.form > p2.form + 1) {
      recommendations.push(`🔥 **Form Pick**: ${p1.name} is in significantly better form and could be a strong differential pick.`);
    } else if (p2.form > p1.form + 1) {
      recommendations.push(`🔥 **Form Pick**: ${p2.name} is in significantly better form and could be a strong differential pick.`);
    }
    
    // Ownership-based recommendations
    const ownership_diff = Math.abs(p1.selected_by_percent - p2.selected_by_percent);
    if (ownership_diff > 10) {
      const lower_owned = p1.selected_by_percent < p2.selected_by_percent ? p1.name : p2.name;
      const higher_owned = p1.selected_by_percent > p2.selected_by_percent ? p1.name : p2.name;
      recommendations.push(`👥 **Differential Strategy**: ${lower_owned} has ${ownership_diff.toFixed(1)}% lower ownership than ${higher_owned}, offering potential for unique team composition.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push("💡 **Balanced Choice**: Both players offer similar value propositions. Consider team structure and fixture schedule for the final decision.");
    }
    
    return recommendations.join('\n\n');
  }

  private static generateMetricsComparison(p1: any, p2: any): any {
    return {
      points: {
        player1: p1.total_points,
        player2: p2.total_points,
        difference: p1.total_points - p2.total_points,
        winner: p1.total_points > p2.total_points ? p1.name : p2.name
      },
      form: {
        player1: p1.form,
        player2: p2.form,
        difference: p1.form - p2.form,
        winner: p1.form > p2.form ? p1.name : p2.name
      },
      value_ratio: {
        player1: p1.value_ratio,
        player2: p2.value_ratio,
        difference: p1.value_ratio - p2.value_ratio,
        winner: p1.value_ratio > p2.value_ratio ? p1.name : p2.name
      },
      consistency: {
        player1: p1.consistency,
        player2: p2.consistency,
        difference: p1.consistency - p2.consistency,
        winner: p1.consistency > p2.consistency ? p1.name : p2.name
      }
    };
  }

  private static generateDynamicSummary(p1: any, p2: any): string {
    // Determine overall winner based on multiple factors
    let p1_score = 0;
    let p2_score = 0;
    
    // Points scoring
    if (p1.total_points > p2.total_points) {
      p1_score += 2;
    } else if (p2.total_points > p1.total_points) {
      p2_score += 2;
    }
      
    // Form
    if (p1.form > p2.form) {
      p1_score += 2;
    } else if (p2.form > p1.form) {
      p2_score += 2;
    }
      
    // Value
    if (p1.value_ratio > p2.value_ratio) {
      p1_score += 1;
    } else if (p2.value_ratio > p1.value_ratio) {
      p2_score += 1;
    }
      
    // Consistency
    if (p1.consistency > p2.consistency) {
      p1_score += 1;
    } else if (p2.consistency > p1.consistency) {
      p2_score += 1;
    }
      
    if (p1_score > p2_score) {
      const winner = p1.name;
      return this.getRandomTemplate(this.analysisTemplates.summary).replace('{winner}', winner);
    } else if (p2_score > p1_score) {
      const winner = p2.name;
      return this.getRandomTemplate(this.analysisTemplates.summary).replace('{winner}', winner);
    } else {
      return "Both players are performing at very similar levels, making this a close call that could go either way.";
    }
  }

  private static generateDynamicDetailedAnalysis(p1: any, p2: any): string {
    const analysis: string[] = [];
    
    // Points analysis with varied language
    const points_diff = Math.abs(p1.total_points - p2.total_points);
    if (points_diff > 20) {
      const better_player = p1.total_points > p2.total_points ? p1.name : p2.name;
      analysis.push(`Season performance shows a clear gap, with ${better_player} leading by ${points_diff} points. This significant difference suggests ${better_player} has been much more consistent throughout the campaign.`);
    } else if (points_diff > 10) {
      analysis.push(`There's a moderate gap in season performance, with ${p1.name} ahead by ${points_diff} points. While not massive, this advantage indicates slightly better consistency over the long term.`);
    } else {
      analysis.push(`Season performance is very tight between these two, with only ${points_diff} points separating them. This suggests both players have been delivering similar value over the course of the season.`);
    }
    
    // Form analysis with varied language
    const form_diff = Math.abs(p1.form - p2.form);
    if (form_diff > 2) {
      const better_form = p1.form > p2.form ? p1.name : p2.name;
      analysis.push(`Recent form is where we see a real difference. ${better_form} has been in much better shape lately, with a ${form_diff.toFixed(1)} point advantage in current form. This momentum could be crucial for upcoming fixtures.`);
    } else if (form_diff > 1) {
      analysis.push(`Current form is quite similar between the two, with ${p1.name} showing a slight edge. The ${form_diff.toFixed(1)} point difference is minimal but could be worth considering.`);
    } else {
      analysis.push(`Form levels are very similar right now, with both players performing at comparable levels in recent matches. This makes form less of a deciding factor in this comparison.`);
    }
    
    // Value analysis with varied language
    const value_diff = Math.abs(p1.value_ratio - p2.value_ratio);
    if (value_diff > 0.5) {
      const better_value = p1.value_ratio > p2.value_ratio ? p1.name : p2.name;
      analysis.push(`Value for money is a key consideration, and ${better_value} stands out here. With a ${value_diff.toFixed(2)} better value ratio, they're offering more points per million spent, which could be crucial for team building.`);
    } else {
      analysis.push(`Both players offer similar value relative to their price tags, so this won't be the deciding factor in your choice.`);
    }
    
    // Playing time analysis with varied language
    if (p1.minutes > 0 && p2.minutes > 0) {
      const minutes_diff = Math.abs(p1.minutes - p2.minutes);
      if (minutes_diff > 500) {
        const more_playing = p1.minutes > p2.minutes ? p1.name : p2.name;
        analysis.push(`Playing time is another important factor. ${more_playing} has been on the pitch significantly more, playing ${Math.floor(minutes_diff / 90)} more full games. This suggests better squad security and manager trust.`);
      }
    }
    
    return analysis.join(' ');
  }

  private static generateDynamicRecommendations(p1: any, p2: any): string {
    const recommendations: string[] = [];
    
    // Price-based recommendations with varied language
    const price_diff = Math.abs(p1.price - p2.price);
    if (price_diff > 2) {
      const cheaper = p1.price < p2.price ? p1.name : p2.name;
      const more_expensive = p1.price > p2.price ? p1.name : p2.name;
      recommendations.push(`Budget management is crucial in FPL, and ${cheaper} could be the smarter choice here. At £${price_diff.toFixed(1)}m less, they offer similar performance while freeing up funds for other positions. This extra money could be the difference between a good and great team.`);
    }
    
    // Form-based recommendations with varied language
    if (p1.form > p2.form + 1) {
      recommendations.push(`Form is everything in fantasy football, and ${p1.name} is clearly in better shape right now. They could be an excellent differential pick that sets your team apart from the crowd.`);
    } else if (p2.form > p1.form + 1) {
      recommendations.push(`Current form suggests ${p2.name} is the player to watch. They're hitting their stride at the right time and could be a strong differential option.`);
    }
    
    // Ownership-based recommendations with varied language
    const ownership_diff = Math.abs(p1.selected_by_percent - p2.selected_by_percent);
    if (ownership_diff > 10) {
      const lower_owned = p1.selected_by_percent < p2.selected_by_percent ? p1.name : p2.name;
      const higher_owned = p1.selected_by_percent > p2.selected_by_percent ? p1.name : p2.name;
      recommendations.push(`Ownership differentials can be key to climbing the rankings. ${lower_owned} has ${ownership_diff.toFixed(1)}% lower ownership than ${higher_owned}, making them a potential game-changer if they perform well. This kind of differential thinking is what separates the best FPL managers from the rest.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push("This is a really close call between two quality players. Both offer similar value propositions, so you might want to consider factors like upcoming fixtures, team form, or even your gut feeling. Sometimes in FPL, the best choice isn't always the most obvious one.");
    }
    
    return recommendations.join(' ');
  }

  private static generateDynamicPositionSpecificAnalysis(p1: any, p2: any): string {
    if (p1.position !== p2.position) {
      const templates = [
        `Comparing ${p1.position} vs ${p2.position} is like comparing apples and oranges. Different positions have different scoring mechanisms, so this comparison might not give you the full picture you're looking for.`,
        `Position mismatch alert! ${p1.position} and ${p2.position} play completely different roles, making this comparison less meaningful than comparing players in the same position.`,
        `This is a tricky comparison since ${p1.position} and ${p2.position} have different responsibilities and scoring opportunities. You might get better insights comparing players in the same position.`
      ];
      return this.getRandomTemplate(templates);
    }
    
    const position = p1.position;
    
    if (position === 'Forward') {
      const goals_diff = p1.goals_scored - p2.goals_scored;
      if (Math.abs(goals_diff) > 3) {
        const better_scorer = goals_diff > 0 ? p1.name : p2.name;
        const templates = [
          `${better_scorer} has been the more lethal finisher this season, scoring ${Math.abs(goals_diff)} more goals. In FPL, goals are gold, and this difference could be crucial for your team.`,
          `Goal-scoring ability is what separates the best forwards, and ${better_scorer} has been more clinical with ${Math.abs(goals_diff)} additional goals. This kind of finishing can make or break your gameweek.`,
          `When it comes to putting the ball in the net, ${better_scorer} has been more effective, leading by ${Math.abs(goals_diff)} goals. In fantasy terms, this translates to more points and more wins.`
        ];
        return this.getRandomTemplate(templates);
      } else {
        return "Both forwards have been finding the back of the net at similar rates this season, making goal-scoring ability less of a deciding factor in this comparison.";
      }
        
    } else if (position === 'Midfielder') {
      const assists_diff = p1.assists - p2.assists;
      if (Math.abs(assists_diff) > 2) {
        const better_assister = assists_diff > 0 ? p1.name : p2.name;
        const templates = [
          `${better_assister} has been the more creative force, providing ${Math.abs(assists_diff)} more assists. In FPL, assists are just as valuable as goals, and this creativity could be key.`,
          `Creative output is crucial for midfielders, and ${better_assister} has been more generous with ${Math.abs(assists_diff)} additional assists. This kind of playmaking ability is gold dust in fantasy football.`,
          `When it comes to setting up teammates, ${better_assister} has been more effective, leading by ${Math.abs(assists_diff)} assists. This creative edge could be the difference in tight gameweeks.`
        ];
        return this.getRandomTemplate(templates);
      } else {
        return "Both midfielders have been contributing assists at similar levels, so creative output won't be the deciding factor here.";
      }
        
    } else if (position === 'Defender') {
      const cs_diff = p1.clean_sheets - p2.clean_sheets;
      if (Math.abs(cs_diff) > 2) {
        const better_defender = cs_diff > 0 ? p1.name : p2.name;
        const templates = [
          `${better_defender} has been part of a more solid defensive unit, contributing to ${Math.abs(cs_diff)} more clean sheets. In FPL, clean sheets are the bread and butter of defensive returns.`,
          `Defensive stability is key for FPL defenders, and ${better_defender} has been part of a more reliable backline with ${Math.abs(cs_diff)} additional clean sheets. This defensive solidity translates to consistent points.`,
          `Clean sheet potential is what makes defenders valuable, and ${better_defender} has been more fortunate in this regard with ${Math.abs(cs_diff)} more clean sheets. This defensive reliability is crucial for consistent returns.`
        ];
        return this.getRandomTemplate(templates);
      } else {
        return "Both defenders have been part of similarly solid defensive units, so clean sheet potential is fairly even between them.";
      }
        
    } else {  // Goalkeeper
      const cs_diff = p1.clean_sheets - p2.clean_sheets;
      if (Math.abs(cs_diff) > 2) {
        const better_gk = cs_diff > 0 ? p1.name : p2.name;
        const templates = [
          `${better_gk} has been behind a more reliable defense, keeping ${Math.abs(cs_diff)} more clean sheets. For goalkeepers, clean sheets are the primary source of points, making this a significant advantage.`,
          `Goalkeeper success is heavily dependent on defensive solidity, and ${better_gk} has benefited from a more organized backline with ${Math.abs(cs_diff)} additional clean sheets. This defensive support is crucial for consistent returns.`,
          `Clean sheet potential is everything for goalkeepers, and ${better_gk} has been more fortunate in this department with ${Math.abs(cs_diff)} more clean sheets. This kind of defensive reliability is what separates good goalkeepers from great ones in FPL.`
        ];
        return this.getRandomTemplate(templates);
      } else {
        return "Both goalkeepers have been working behind similarly solid defenses, so clean sheet potential is fairly balanced between them.";
      }
    }
  }
}
