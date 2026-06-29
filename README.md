//@version=6
indicator("AlgoIntel Pro 15m", shorttitle="AI Pro", overlay=true, max_boxes_count=60, max_lines_count=60, max_labels_count=50, max_bars_back=500)

// ══════════════════════════════════════════════
//  INPUTS
// ══════════════════════════════════════════════

g1 = "EMA"
i_e9   = input.bool(true,  "EMA 9",   group=g1)
i_e15  = input.bool(true,  "EMA 15",  group=g1)
i_e300 = input.bool(true,  "EMA 300", group=g1)

g2 = "Zones"
i_fvg     = input.bool(true,  "Show FVG",         group=g2)
i_fvg_min = input.float(0.003,"FVG Min Pct",       group=g2, minval=0.001, step=0.001)
i_ob      = input.bool(true,  "Show Order Blocks", group=g2)
i_ob_min  = input.float(0.008,"OB Min Impulse Pct",group=g2, minval=0.002, step=0.001)

g3 = "Liquidity"
i_liq     = input.bool(true,  "Show EQ Levels",   group=g3)
i_sweep   = input.bool(true,  "Show Sweeps",      group=g3)
i_liq_tol = input.float(0.15, "EQ Tolerance Pct", group=g3, minval=0.05, maxval=0.5, step=0.05)
i_asia    = input.bool(true,  "Show Asia Range",  group=g3)

g4 = "Sessions"
i_sess = input.bool(true, "Kill Zone Tint",   group=g4)
i_sf   = input.bool(true, "KZ Signals Only",  group=g4)
i_news = input.bool(true, "News Warnings",    group=g4)

g5 = "Structure"
i_ms    = input.bool(true, "BOS and CHoCH", group=g5)
i_ms_lb = input.int(5,     "Swing Bars",     group=g5, minval=3, maxval=15)
i_sr    = input.bool(true, "SR Pivots",      group=g5)

g6 = "Patterns"
i_cp  = input.bool(true, "Candle Patterns", group=g6)
i_chp = input.bool(true, "Chart Patterns",  group=g6)

g7 = "Signal"
i_acc   = input.int(68,    "Min Accuracy Pct",  group=g7, minval=50, maxval=95)
i_steps = input.int(4,     "Min Steps of 7",    group=g7, minval=1,  maxval=7)
i_rr    = input.bool(true, "Show SL TP Lines",  group=g7)
i_sl_m  = input.float(1.5, "SL ATR mult",       group=g7, minval=0.5, step=0.1)
i_tp1_m = input.float(2.0, "TP1 ATR mult 15m",  group=g7, minval=0.5, step=0.1)
i_tp2_m = input.float(3.5, "TP2 ATR mult 1H",   group=g7, minval=1.0, step=0.1)
i_tp3_m = input.float(6.0, "TP3 ATR mult 4H",   group=g7, minval=1.0, step=0.1)

g8 = "Dashboard"
i_tbl  = input.bool(true, "Show Table", group=g8)
i_tpos = input.string("Top Right", "Position", group=g8, options=["Top Right","Top Left","Bottom Right","Bottom Left"])

// ══════════════════════════════════════════════
//  COLOURS
// ══════════════════════════════════════════════

C_G   = #00e676
C_R   = #ff1744
C_B   = #00b0ff
C_Y   = #ffca28
C_P   = #ce93d8
C_O   = #ff7043
C_T   = #80cbc4
C_GRY = #546e7a
C_TXT = #90a4ae
C_DIM = color.new(#455a64, 65)
BG_G  = color.new(#00e676, 91)
BG_R  = color.new(#ff1744, 91)
BD_G  = color.new(#00e676, 42)
BD_R  = color.new(#ff1744, 42)
TBL   = color.new(#0d1b2a, 8)
TBL_H = color.new(#0a1624, 5)
TBL_A = color.new(#112030, 12)

// ══════════════════════════════════════════════
//  CORE INDICATORS
// ══════════════════════════════════════════════

e9     = ta.ema(close, 9)
e15    = ta.ema(close, 15)
e300   = ta.ema(close, 300)
atr    = ta.atr(14)
rsi    = ta.rsi(close, 14)
vol_ma = ta.sma(volume, 20)

high_vol = volume > vol_ma * 1.4
vol_exp  = volume > volume[1] * 1.25
ebull    = e9 > e15
emacro   = close > e300
eup      = e9 > e15 and e9[1] <= e15[1]
edn      = e9 < e15 and e9[1] >= e15[1]

bb_mid = ta.sma(close, 20)
bb_std = ta.stdev(close, 20)
bb_up  = bb_mid + 2.0 * bb_std
bb_dn  = bb_mid - 2.0 * bb_std
bb_w   = (bb_up - bb_dn) / math.max(bb_mid, 0.0001)
bb_sqz = bb_w < ta.sma(bb_w, 50) * 0.75
atr_ma = ta.sma(atr, 20)

// Pre-compute all rolling lookups at global scope
h15_hi   = ta.highest(high, 15)
h15_lo   = ta.lowest(low,   15)
h25_hi   = ta.highest(high, 25)
h25_lo   = ta.lowest(low,   25)
h5_hi15  = ta.highest(high[5], 15)
h5_lo15  = ta.lowest(low[5],   15)
h10_hi   = ta.highest(high, 10)
h10_lo   = ta.lowest(low,   10)
h5_hi10  = ta.highest(high[5], 10)
h5_lo10  = ta.lowest(low[5],   10)
h12_hi   = ta.highest(high, 12)
h12_lo   = ta.lowest(low,   12)
h6_hi12  = ta.highest(high[6], 12)
h6_lo12  = ta.lowest(low[6],   12)
h6_hi6   = ta.highest(high[6], 6)
h6_lo6   = ta.lowest(low[6],   6)
h5_hi5   = ta.highest(high[5], 5)
h5_lo5   = ta.lowest(low[5],   5)
h1_hi10  = ta.highest(high[1], 10)
h1_lo10  = ta.lowest(low[1],   10)
h5_hi10b = ta.highest(high[5], 10)
h5_lo10b = ta.lowest(low[5],   10)
hi5      = ta.highest(high, 5)
lo5      = ta.lowest(low,   5)
hi5b     = ta.highest(high[5], 5)
lo5b     = ta.lowest(low[5],   5)

cup_lb   = ta.lowestbars(low, 30)
cup_lo   = ta.lowest(close, 30)
cup_hi3  = ta.highest(close[3], 5)

w15_rng  = h15_hi - h15_lo
w25_rng  = h25_hi - h25_lo

// ══════════════════════════════════════════════
//  EMA PLOTS
// ══════════════════════════════════════════════

plot(i_e9   ? e9   : na, "EMA 9",   color=color.new(C_G,12), linewidth=1)
plot(i_e15  ? e15  : na, "EMA 15",  color=color.new(C_Y,12), linewidth=1)
plot(i_e300 ? e300 : na, "EMA 300", color=color.new(C_B, 8), linewidth=2)

// ══════════════════════════════════════════════
//  SESSIONS
// ══════════════════════════════════════════════

h_utc   = hour(time,     "UTC")
m_utc   = minute(time,   "UTC")
dow_utc = dayofweek(time,"UTC")

is_asia = h_utc >= 0  and h_utc < 7
is_lkz  = h_utc >= 7  and h_utc < 10
is_nykz = h_utc >= 13 and h_utc < 16
good_s  = is_lkz or is_nykz

news_1330 = (h_utc == 13 and m_utc >= 25) or (h_utc == 14 and m_utc < 5)
news_fomc = (h_utc == 17 and m_utc >= 55) or (h_utc >= 18 and h_utc < 20)
fri_pm    = dow_utc == 6 and h_utc >= 13
news_risk = news_1330 or news_fomc or fri_pm

sess_bg = is_lkz ? color.new(C_B,97) : is_nykz ? color.new(C_R,97) : is_asia ? color.new(C_Y,98) : na
bgcolor(i_sess ? sess_bg : na, title="Session")

if is_lkz and not is_lkz[1] and i_sess
    label.new(bar_index, high + atr * 0.5, "LDN KZ", color=color.new(C_B,72), textcolor=C_B, style=label.style_label_down, size=size.tiny)

if is_nykz and not is_nykz[1] and i_sess
    label.new(bar_index, high + atr * 0.5, "NY KZ", color=color.new(C_R,72), textcolor=C_R, style=label.style_label_down, size=size.tiny)

if i_news and news_risk and not news_risk[1]
    label.new(bar_index, high + atr * 1.2, "NEWS RISK", color=color.new(C_Y,4), textcolor=C_Y, style=label.style_label_down, size=size.normal)

var float asia_hi = na
var float asia_lo = na

if is_asia and not is_asia[1]
    asia_hi := high
    asia_lo := low

if is_asia
    asia_hi := math.max(asia_hi, high)
    asia_lo := math.min(asia_lo, low)

if i_asia and is_lkz and not is_lkz[1] and not na(asia_hi)
    line.new(bar_index, asia_hi, bar_index + 30, asia_hi, color=color.new(C_Y,42), width=1, style=line.style_dotted)
    line.new(bar_index, asia_lo, bar_index + 30, asia_lo, color=color.new(C_Y,42), width=1, style=line.style_dotted)
    label.new(bar_index, asia_hi, "Asia Hi", color=color.new(C_Y,78), textcolor=C_Y, style=label.style_label_right, size=size.tiny)
    label.new(bar_index, asia_lo, "Asia Lo", color=color.new(C_Y,78), textcolor=C_Y, style=label.style_label_right, size=size.tiny)

// ══════════════════════════════════════════════
//  SWING PIVOTS
// ══════════════════════════════════════════════

ph_raw = ta.pivothigh(high, i_ms_lb, i_ms_lb)
pl_raw = ta.pivotlow(low,   i_ms_lb, i_ms_lb)

var float sh1  = na
var float sh2  = na
var float sh3  = na
var float sl1  = na
var float sl2  = na
var float sl3  = na
var int   sh1b = na
var int   sh2b = na
var int   sl1b = na
var int   sl2b = na

if not na(ph_raw)
    sh3  := sh2
    sh2  := sh1
    sh1  := ph_raw
    sh2b := sh1b
    sh1b := bar_index - i_ms_lb

if not na(pl_raw)
    sl3  := sl2
    sl2  := sl1
    sl1  := pl_raw
    sl2b := sl1b
    sl1b := bar_index - i_ms_lb

ph_sr = ta.pivothigh(high, 12, 12)
pl_sr = ta.pivotlow(low,   12, 12)

if i_sr and not na(ph_sr)
    line.new(bar_index - 12, ph_sr, bar_index + 8, ph_sr, color=color.new(C_R,50), width=1, style=line.style_dashed)

if i_sr and not na(pl_sr)
    line.new(bar_index - 12, pl_sr, bar_index + 8, pl_sr, color=color.new(C_G,50), width=1, style=line.style_dashed)

// ══════════════════════════════════════════════
//  EQUAL HIGHS / LOWS
// ══════════════════════════════════════════════

tol       = i_liq_tol / 100.0
eq_hi     = not na(sh1) and not na(sh2) and math.abs(sh1 - sh2) / math.max(math.max(sh1,sh2), 0.0001) < tol
eq_lo     = not na(sl1) and not na(sl2) and math.abs(sl1 - sl2) / math.max(math.max(sl1,sl2), 0.0001) < tol
eq_hi_lvl = eq_hi ? math.max(sh1, sh2) : na
eq_lo_lvl = eq_lo ? math.min(sl1, sl2) : na

if i_liq and eq_hi and barstate.isconfirmed and not na(sh1b) and not na(sh2b)
    line.new(math.min(sh1b, sh2b), eq_hi_lvl, bar_index + 12, eq_hi_lvl, color=color.new(C_O,40), width=1, style=line.style_dotted)
    label.new(math.min(sh1b, sh2b), eq_hi_lvl, "EQH", color=color.new(C_O,75), textcolor=C_O, style=label.style_label_right, size=size.tiny)

if i_liq and eq_lo and barstate.isconfirmed and not na(sl1b) and not na(sl2b)
    line.new(math.min(sl1b, sl2b), eq_lo_lvl, bar_index + 12, eq_lo_lvl, color=color.new(C_T,40), width=1, style=line.style_dotted)
    label.new(math.min(sl1b, sl2b), eq_lo_lvl, "EQL", color=color.new(C_T,75), textcolor=C_T, style=label.style_label_right, size=size.tiny)

// ══════════════════════════════════════════════
//  LIQUIDITY SWEEPS
// ══════════════════════════════════════════════

wick_ext = atr * 0.25

bull_swp_eq  = eq_lo and not na(eq_lo_lvl) and low < eq_lo_lvl - wick_ext and close > eq_lo_lvl and (close - low) / math.max(atr, 0.0001) > 0.45
bear_swp_eq  = eq_hi and not na(eq_hi_lvl) and high > eq_hi_lvl + wick_ext and close < eq_hi_lvl and (high - close) / math.max(atr, 0.0001) > 0.45
bull_swp_gen = low < h1_lo10 - wick_ext and close > h1_lo10 and vol_exp and (close - low) / math.max(atr, 0.0001) > 0.50
bear_swp_gen = high > h1_hi10 + wick_ext and close < h1_hi10 and vol_exp and (high - close) / math.max(atr, 0.0001) > 0.50

bull_sweep      = bull_swp_eq or bull_swp_gen
bear_sweep      = bear_swp_eq or bear_swp_gen
bull_sweep_conf = bull_sweep and high_vol
bear_sweep_conf = bear_sweep and high_vol

if i_sweep and bull_sweep
    swp_txt = bull_sweep_conf ? "SWEEP 85%" : "Sweep 70%"
    label.new(bar_index, low - atr * 0.35, swp_txt, color=color.new(C_T, bull_sweep_conf ? 5 : 18), textcolor=C_T, style=label.style_label_up, size=size.small)

if i_sweep and bear_sweep
    swp_txt2 = bear_sweep_conf ? "SWEEP 85%" : "Sweep 70%"
    label.new(bar_index, high + atr * 0.35, swp_txt2, color=color.new(C_O, bear_sweep_conf ? 5 : 18), textcolor=C_O, style=label.style_label_down, size=size.small)

// ══════════════════════════════════════════════
//  FAIR VALUE GAP
// ══════════════════════════════════════════════

c2_bp   = math.abs(close[1] - open[1]) / math.max(high[1] - low[1], 0.0001)
c2_imp  = c2_bp > 0.50
c2_bull = close[1] > open[1]
c2_bear = close[1] < open[1]
bfvg_sz = high[2] < low[0]  ? (low[0]  - high[2]) / math.max(close, 0.0001) : 0.0
sfvg_sz = low[2]  > high[0] ? (low[2]  - high[0]) / math.max(close, 0.0001) : 0.0
is_bfvg = high[2] < low[0]  and c2_imp and c2_bull and bfvg_sz > i_fvg_min
is_sfvg = low[2]  > high[0] and c2_imp and c2_bear and sfvg_sz > i_fvg_min

if i_fvg and is_bfvg
    box.new(bar_index - 2, low[0], bar_index + 10, high[2], bgcolor=BG_G, border_color=BD_G, border_width=1, border_style=line.style_dashed, text="FVG", text_color=C_G, text_size=size.tiny)

if i_fvg and is_sfvg
    box.new(bar_index - 2, high[0], bar_index + 10, low[2], bgcolor=BG_R, border_color=BD_R, border_width=1, border_style=line.style_dashed, text="FVG", text_color=C_R, text_size=size.tiny)

// ══════════════════════════════════════════════
//  ORDER BLOCKS
// ══════════════════════════════════════════════

ob_move = math.abs(close - open)
ob_thr  = close * i_ob_min
bull_ob = close[1] < open[1] and close > open and ob_move > ob_thr
bear_ob = close[1] > open[1] and close < open and ob_move > ob_thr
ob_mid  = (high[1] + low[1]) / 2.0

if i_ob and bull_ob
    box.new(bar_index - 1, low[1], bar_index + 8, high[1], bgcolor=BG_G, border_color=BD_G, border_width=1, text="OB", text_color=C_G, text_size=size.tiny)
    line.new(bar_index - 1, ob_mid, bar_index + 8, ob_mid, color=color.new(C_G,32), width=1, style=line.style_dotted)

if i_ob and bear_ob
    box.new(bar_index - 1, low[1], bar_index + 8, high[1], bgcolor=BG_R, border_color=BD_R, border_width=1, text="OB", text_color=C_R, text_size=size.tiny)
    line.new(bar_index - 1, ob_mid, bar_index + 8, ob_mid, color=color.new(C_R,32), width=1, style=line.style_dotted)

var float lb_bhi  = na
var float lb_blo  = na
var int   lb_bbar = na
var float lb_shi  = na
var float lb_slo  = na
var int   lb_sbar = na

if bull_ob
    lb_bhi  := high[1]
    lb_blo  := low[1]
    lb_bbar := bar_index

if bear_ob
    lb_shi  := high[1]
    lb_slo  := low[1]
    lb_sbar := bar_index

bull_brk = not na(lb_blo) and close < lb_blo and bar_index > lb_bbar + 2
bear_brk = not na(lb_shi) and close > lb_shi and bar_index > lb_sbar + 2

if bull_brk
    label.new(bar_index, low - atr * 0.35, "BRK", color=color.new(C_P,10), textcolor=C_P, style=label.style_label_up, size=size.tiny)

if bear_brk
    label.new(bar_index, high + atr * 0.35, "BRK", color=color.new(C_P,10), textcolor=C_P, style=label.style_label_down, size=size.tiny)

// ══════════════════════════════════════════════
//  MARKET STRUCTURE
// ══════════════════════════════════════════════

var float ms_hi = na
var float ms_lo = na

if not na(ph_raw)
    ms_hi := ph_raw

if not na(pl_raw)
    ms_lo := pl_raw

bos_bull   = not na(ms_hi) and close > ms_hi and close[1] <= ms_hi
bos_bear   = not na(ms_lo) and close < ms_lo and close[1] >= ms_lo
choch_bull = bos_bull and not ebull
choch_bear = bos_bear and ebull

if i_ms and choch_bull and not choch_bull[1]
    label.new(bar_index, high + atr * 0.45, "CHoCH", color=color.new(C_T,8), textcolor=C_T, style=label.style_label_down, size=size.small)

if i_ms and bos_bull and not bos_bull[1] and not choch_bull
    label.new(bar_index, high + atr * 0.3, "BOS", color=color.new(C_G,10), textcolor=C_G, style=label.style_label_down, size=size.tiny)

if i_ms and choch_bear and not choch_bear[1]
    label.new(bar_index, low - atr * 0.45, "CHoCH", color=color.new(C_O,8), textcolor=C_O, style=label.style_label_up, size=size.small)

if i_ms and bos_bear and not bos_bear[1] and not choch_bear
    label.new(bar_index, low - atr * 0.3, "BOS", color=color.new(C_R,10), textcolor=C_R, style=label.style_label_up, size=size.tiny)

// ══════════════════════════════════════════════
//  CANDLESTICK PATTERNS
// ══════════════════════════════════════════════

c_bd  = math.abs(close - open)
c_rng = math.max(high - low, 0.0001)
c_uwk = high - math.max(open, close)
c_lwk = math.min(open, close) - low
c_bp  = c_bd / c_rng

p_hammer  = c_bp < 0.35 and c_lwk / c_rng > 0.55 and close > open
p_hangman = c_bp < 0.35 and c_lwk / c_rng > 0.55 and close < open
p_shoot   = c_bp < 0.35 and c_uwk / c_rng > 0.55 and close < open
p_invhmr  = c_bp < 0.35 and c_uwk / c_rng > 0.55 and close > open
p_doji    = c_bp < 0.07
p_drag    = c_bp < 0.07 and c_lwk / c_rng > 0.65
p_grav    = c_bp < 0.07 and c_uwk / c_rng > 0.65
gap_up    = open > high[1]
gap_dn    = open < low[1]
p_bull_eng = close[1] < open[1] and close > open and open <= close[1] and close >= open[1] and c_bd > c_bd[1] * 0.9
p_bear_eng = close[1] > open[1] and close < open and open >= close[1] and close <= open[1] and c_bd > c_bd[1] * 0.9
p_pierce   = close[1] < open[1] and close > open and open < close[1] and close > (open[1] + close[1]) / 2
p_dkcloud  = close[1] > open[1] and close < open and open > close[1] and close < (open[1] + close[1]) / 2
p_morn     = close[2] < open[2] and c_bp[1] < 0.25 and close > open and close >= (open[2] + close[2]) / 2
p_eve      = close[2] > open[2] and c_bp[1] < 0.25 and close < open and close <= (open[2] + close[2]) / 2

bull_cs = p_hammer or p_invhmr  or p_bull_eng or p_pierce or p_morn or p_drag or gap_up
bear_cs = p_shoot  or p_hangman or p_bear_eng or p_dkcloud or p_eve  or p_grav or gap_dn

sh_hammer = i_cp and p_hammer   and not bull_ob
sh_shoot  = i_cp and p_shoot    and not bear_ob
sh_bull_e = i_cp and p_bull_eng and not bull_ob
sh_bear_e = i_cp and p_bear_eng and not bear_ob
sh_morn   = i_cp and p_morn
sh_eve    = i_cp and p_eve
sh_drag   = i_cp and p_drag     and not bull_ob
sh_grav   = i_cp and p_grav     and not bear_ob
sh_doji   = i_cp and p_doji     and not bull_ob and not bear_ob
sh_gap_up = i_cp and gap_up
sh_gap_dn = i_cp and gap_dn

plotshape(sh_hammer, "Hammer",       shape.triangleup,   location.belowbar, color.new(C_G,15), size=size.tiny)
plotshape(sh_shoot,  "Shoot Star",   shape.triangledown, location.abovebar, color.new(C_R,15), size=size.tiny)
plotshape(sh_bull_e, "Bull Engulf",  shape.circle,       location.belowbar, color.new(C_G,20), size=size.small)
plotshape(sh_bear_e, "Bear Engulf",  shape.circle,       location.abovebar, color.new(C_R,20), size=size.small)
plotshape(sh_morn,   "Morning Star", shape.triangleup,   location.belowbar, C_G,               size=size.small)
plotshape(sh_eve,    "Evening Star", shape.triangledown, location.abovebar, C_R,               size=size.small)
plotshape(sh_drag,   "Dragonfly",    shape.triangleup,   location.belowbar, color.new(C_T,20), size=size.tiny)
plotshape(sh_grav,   "Gravestone",   shape.triangledown, location.abovebar, color.new(C_T,20), size=size.tiny)
plotshape(sh_doji,   "Doji",         shape.xcross,       location.abovebar, color.new(C_Y,40), size=size.tiny)
plotshape(sh_gap_up, "Gap Up",       shape.labelup,      location.belowbar, color.new(C_G,55), size=size.tiny)
plotshape(sh_gap_dn, "Gap Down",     shape.labeldown,    location.abovebar, color.new(C_R,55), size=size.tiny)
plotshape(eup,       "EMA X Up",     shape.triangleup,   location.belowbar, color.new(C_G,25), size=size.tiny)
plotshape(edn,       "EMA X Down",   shape.triangledown, location.abovebar, color.new(C_R,25), size=size.tiny)

// ══════════════════════════════════════════════
//  CHART PATTERNS
// ══════════════════════════════════════════════

var float dt_h1 = na
var float dt_h2 = na
var bool dt_active = false
var float db_l1 = na
var float db_l2 = na
var bool db_active = false

if not na(ph_raw)
    if na(dt_h1)
        dt_h1 := ph_raw
    else if math.abs(ph_raw - dt_h1) / math.max(dt_h1, 0.0001) < 0.012
        dt_h2 := ph_raw
        dt_active := true
    else
        dt_h1 := ph_raw
        dt_h2 := na
        dt_active := false

if not na(pl_raw)
    if na(db_l1)
        db_l1 := pl_raw
    else if math.abs(pl_raw - db_l1) / math.max(db_l1, 0.0001) < 0.012
        db_l2 := pl_raw
        db_active := true
    else
        db_l1 := pl_raw
        db_l2 := na
        db_active := false

cp_dbl_top = dt_active and bos_bear
cp_dbl_bot = db_active and bos_bull

var int   tt_cnt = 0
var float tt_lvl = na
var int   tb_cnt = 0
var float tb_lvl = na

if not na(ph_raw)
    if na(tt_lvl)
        tt_lvl := ph_raw
        tt_cnt := 1
    else if math.abs(ph_raw - tt_lvl) / math.max(tt_lvl, 0.0001) < 0.012
        tt_cnt := tt_cnt + 1
    else
        tt_lvl := ph_raw
        tt_cnt := 1

if not na(pl_raw)
    if na(tb_lvl)
        tb_lvl := pl_raw
        tb_cnt := 1
    else if math.abs(pl_raw - tb_lvl) / math.max(tb_lvl, 0.0001) < 0.012
        tb_cnt := tb_cnt + 1
    else
        tb_lvl := pl_raw
        tb_cnt := 1

cp_triple_top = tt_cnt >= 3 and bos_bear
cp_triple_bot = tb_cnt >= 3 and bos_bull

cp_hns_form = not na(sh1) and not na(sh2) and not na(sh3) and sh2 > sh1 and sh2 > sh3 and math.abs(sh1 - sh3) / math.max(math.max(sh1,sh2), 0.0001) < 0.025
cp_hns      = cp_hns_form and bos_bear
cp_ihs_form = not na(sl1) and not na(sl2) and not na(sl3) and sl2 < sl1 and sl2 < sl3 and math.abs(sl1 - sl3) / math.max(math.max(sl1,sl2), 0.0001) < 0.025
cp_ihs      = cp_ihs_form and bos_bull

cp_asc  = math.abs(h15_hi - h5_hi15) / math.max(h15_hi, 0.0001) < 0.008 and h10_lo > h5_lo10 + atr * 0.2 and ebull
cp_desc = math.abs(h15_lo - h5_lo15) / math.max(h15_lo, 0.0001) < 0.008 and h10_hi < h5_hi10 - atr * 0.2 and not ebull
cp_sym  = h12_hi < h6_hi12 - atr * 0.25 and h12_lo > h6_lo12 + atr * 0.25

pole_rng  = h5_hi5 - h5_lo5
cp_bflag  = pole_rng > atr * 3.0 and close[5] > open[5] and w15_rng < atr * 2.0 and ebull
cp_sflag  = pole_rng > atr * 3.0 and close[5] < open[5] and w15_rng < atr * 2.0 and not ebull

rw_nar  = w15_rng < w25_rng * 0.65
cp_rwdg = h12_hi > h6_hi6 and h12_lo > h6_lo6 and rw_nar and not ebull[6]
cp_fwdg = h12_hi < h6_hi6 and h12_lo < h6_lo6 and rw_nar and ebull[6]

cp_rect = math.abs(h15_hi - h5_hi10b) / math.max(h15_hi, 0.0001) < 0.007 and math.abs(h15_lo - h5_lo10b) / math.max(h15_lo, 0.0001) < 0.007 and w15_rng / math.max(close, 0.0001) < 0.015
cp_mega = hi5 > hi5b + atr * 0.4 and lo5 < lo5b - atr * 0.4
cp_diam = cp_mega[10] and cp_sym

pipe_tall = c_rng > atr * 1.5 and math.max(high[1] - low[1], 0.0001) > atr * 1.5
cp_ptop   = pipe_tall and math.abs(high - high[1]) / math.max(high, 0.0001) < 0.003 and close < open and close[1] > open[1]
cp_pbot   = pipe_tall and math.abs(low  - low[1])  / math.max(low,  0.0001) < 0.003 and close > open and close[1] < open[1]
cp_cup    = cup_lb > 20 and close > cup_hi3 and close > cup_lo + w25_rng * 0.7 and ebull

cp_bull_any = cp_dbl_bot or cp_ihs or cp_triple_bot or cp_asc or cp_bflag or cp_fwdg or cp_pbot or cp_cup
cp_bear_any = cp_dbl_top or cp_hns or cp_triple_top or cp_desc or cp_sflag or cp_rwdg or cp_ptop

cp_name = cp_hns ? "H&S 83%" : cp_ihs ? "Inv H&S 83%" : cp_dbl_top ? "Dbl Top 75%" : cp_dbl_bot ? "Dbl Bot 78%" : cp_triple_top ? "Triple Top 70%" : cp_triple_bot ? "Triple Bot 72%" : cp_bflag ? "Bull Flag 67%" : cp_sflag ? "Bear Flag 65%" : cp_asc ? "Asc Tri 72%" : cp_desc ? "Desc Tri 73%" : cp_sym ? "Sym Tri 54%" : cp_rwdg ? "Rise Wedge 73%" : cp_fwdg ? "Fall Wedge 74%" : cp_ptop ? "Pipe Top 66%" : cp_pbot ? "Pipe Bot 66%" : cp_rect ? "Rectangle 68%" : cp_mega ? "Megaphone 56%" : cp_diam ? "Diamond 69%" : cp_cup ? "Cup Handle 65%" : "None"

if i_chp and cp_dbl_top and not cp_dbl_top[1]
    label.new(bar_index, high + atr * 0.9, "Dbl Top 75%", color=color.new(C_R,8), textcolor=C_R, style=label.style_label_down, size=size.small)
if i_chp and cp_dbl_bot and not cp_dbl_bot[1]
    label.new(bar_index, low - atr * 0.9, "Dbl Bot 78%", color=color.new(C_G,8), textcolor=C_G, style=label.style_label_up, size=size.small)
if i_chp and cp_hns and not cp_hns[1]
    label.new(bar_index, high + atr * 0.9, "H&S 83%", color=color.new(C_R,8), textcolor=C_R, style=label.style_label_down, size=size.small)
if i_chp and cp_ihs and not cp_ihs[1]
    label.new(bar_index, low - atr * 0.9, "Inv H&S 83%", color=color.new(C_G,8), textcolor=C_G, style=label.style_label_up, size=size.small)
if i_chp and cp_triple_top and not cp_triple_top[1]
    label.new(bar_index, high + atr * 0.9, "Triple Top 70%", color=color.new(C_R,8), textcolor=C_R, style=label.style_label_down, size=size.small)
if i_chp and cp_triple_bot and not cp_triple_bot[1]
    label.new(bar_index, low - atr * 0.9, "Triple Bot 72%", color=color.new(C_G,8), textcolor=C_G, style=label.style_label_up, size=size.small)
if i_chp and cp_bflag and not cp_bflag[1]
    label.new(bar_index, low - atr * 0.5, "Bull Flag 67%", color=color.new(C_G,10), textcolor=C_G, style=label.style_label_up, size=size.tiny)
if i_chp and cp_sflag and not cp_sflag[1]
    label.new(bar_index, high + atr * 0.5, "Bear Flag 65%", color=color.new(C_R,10), textcolor=C_R, style=label.style_label_down, size=size.tiny)
if i_chp and cp_asc and not cp_asc[1]
    label.new(bar_index, low - atr * 0.5, "Asc Tri 72%", color=color.new(C_T,10), textcolor=C_T, style=label.style_label_up, size=size.tiny)
if i_chp and cp_desc and not cp_desc[1]
    label.new(bar_index, high + atr * 0.5, "Desc Tri 73%", color=color.new(C_R,10), textcolor=C_R, style=label.style_label_down, size=size.tiny)
if i_chp and cp_ptop and not cp_ptop[1]
    label.new(bar_index, high + atr * 0.6, "Pipe Top 66%", color=color.new(C_R,12), textcolor=C_R, style=label.style_label_down, size=size.tiny)
if i_chp and cp_pbot and not cp_pbot[1]
    label.new(bar_index, low - atr * 0.6, "Pipe Bot 66%", color=color.new(C_G,12), textcolor=C_G, style=label.style_label_up, size=size.tiny)
if i_chp and cp_rwdg and not cp_rwdg[1]
    label.new(bar_index, high + atr * 0.5, "Rise Wedge 73%", color=color.new(C_R,10), textcolor=C_R, style=label.style_label_down, size=size.tiny)
if i_chp and cp_fwdg and not cp_fwdg[1]
    label.new(bar_index, low - atr * 0.5, "Fall Wedge 74%", color=color.new(C_G,10), textcolor=C_G, style=label.style_label_up, size=size.tiny)

// ══════════════════════════════════════════════
//  VOLATILITY
// ══════════════════════════════════════════════

trending = atr > atr_ma * 1.15 and math.abs(close - open) / math.max(atr, 0.0001) > 0.4
ranging  = atr < atr_ma * 0.85
vol_lbl  = trending ? "TRENDING" : bb_sqz ? "SQUEEZE" : ranging ? "RANGING" : "NEUTRAL"
vol_col  = trending ? C_G : bb_sqz ? C_Y : C_GRY

// ══════════════════════════════════════════════
//  CONFLUENCE SCORING
// ══════════════════════════════════════════════

bs = 0
bs := emacro          ? bs + 20 : bs
bs := ebull           ? bs + 14 : bs
bs := close > e9      ? bs + 7  : bs
bs := bos_bull        ? bs + 8  : bs
bs := choch_bull      ? bs + 10 : bs
bs := is_bfvg         ? bs + 11 : bs
bs := bull_ob         ? bs + 13 : bs
bs := bull_sweep_conf ? bs + 10 : bs
bs := bull_cs         ? bs + 6  : bs
bs := cp_bull_any     ? bs + 5  : bs
bs := good_s          ? bs + 8  : bs
bs := high_vol        ? bs + 5  : bs
bs := rsi > 50        ? bs + 4  : bs
bs := bear_brk        ? bs + 5  : bs
bs := eup             ? bs + 4  : bs

ss = 0
ss := not emacro      ? ss + 20 : ss
ss := not ebull       ? ss + 14 : ss
ss := close < e9      ? ss + 7  : ss
ss := bos_bear        ? ss + 8  : ss
ss := choch_bear      ? ss + 10 : ss
ss := is_sfvg         ? ss + 11 : ss
ss := bear_ob         ? ss + 13 : ss
ss := bear_sweep_conf ? ss + 10 : ss
ss := bear_cs         ? ss + 6  : ss
ss := cp_bear_any     ? ss + 5  : ss
ss := good_s          ? ss + 8  : ss
ss := high_vol        ? ss + 5  : ss
ss := rsi < 50        ? ss + 4  : ss
ss := bull_brk        ? ss + 5  : ss
ss := edn             ? ss + 4  : ss

bacc = math.min(math.round(bs / 130.0 * 100), 96)
sacc = math.min(math.round(ss / 130.0 * 100), 96)

// ══════════════════════════════════════════════
//  7-STEP CONFIRMATION
// ══════════════════════════════════════════════

st1b = emacro
st1s = not emacro
st2b = ebull
st2s = not ebull
st3  = good_s
st4b = is_bfvg or bull_ob
st4s = is_sfvg or bear_ob
st5b = close > e15 and e9 > e15
st5s = close < e15 and e9 < e15
st6b = bull_cs or cp_bull_any or bull_sweep
st6s = bear_cs or cp_bear_any or bear_sweep
st7  = atr > 0 and rsi > 15 and rsi < 85 and not news_risk

bst = (st1b ? 1 : 0) + (st2b ? 1 : 0) + (st3 ? 1 : 0) + (st4b ? 1 : 0) + (st5b ? 1 : 0) + (st6b ? 1 : 0) + (st7 ? 1 : 0)
sst = (st1s ? 1 : 0) + (st2s ? 1 : 0) + (st3 ? 1 : 0) + (st4s ? 1 : 0) + (st5s ? 1 : 0) + (st6s ? 1 : 0) + (st7 ? 1 : 0)

// ══════════════════════════════════════════════
//  SIGNAL GENERATION
// ══════════════════════════════════════════════

sess_ok = i_sf ? good_s : true
no_news = not news_risk

var bool bsig = false
var bool ssig = false

bsig := bacc >= i_acc and bst >= i_steps and sess_ok and no_news and not bsig[1]
ssig := sacc >= i_acc and sst >= i_steps and sess_ok and no_news and not ssig[1]

// ══════════════════════════════════════════════
//  SL / TP
// ══════════════════════════════════════════════

sl_d = atr * i_sl_m
t1_d = atr * i_tp1_m
t2_d = atr * i_tp2_m
t3_d = atr * i_tp3_m
rr1  = math.round(t1_d / math.max(sl_d, 0.0001), 1)
rr2  = math.round(t2_d / math.max(sl_d, 0.0001), 1)
rr3  = math.round(t3_d / math.max(sl_d, 0.0001), 1)
b_sl = close - sl_d
b_t1 = close + t1_d
b_t2 = close + t2_d
b_t3 = close + t3_d
s_sl = close + sl_d
s_t1 = close - t1_d
s_t2 = close - t2_d
s_t3 = close - t3_d

// ══════════════════════════════════════════════
//  SIGNAL LABELS
// ══════════════════════════════════════════════

if bsig
    b_why = is_bfvg and bull_ob ? "FVG plus OB" : bull_sweep_conf ? "Liq Sweep 85%" : is_bfvg ? "FVG 78%" : bull_ob ? "OB 80%" : choch_bull ? "CHoCH Bull" : bos_bull ? "BOS Bull" : cp_ihs ? "Inv H&S 83%" : cp_dbl_bot ? "Dbl Bot 78%" : cp_bflag ? "Bull Flag 67%" : p_morn ? "Morn Star 72%" : p_bull_eng ? "Bull Eng 63%" : "EMA Align"
    label.new(bar_index, low - atr * 0.9, "LONG " + str.tostring(bacc) + "pct " + str.tostring(bst) + "/7\n" + "Why: " + b_why + "\n" + "Entry: " + str.tostring(math.round(close,1)) + "\n" + "SL: " + str.tostring(math.round(b_sl,1)) + "\n" + "TP1: " + str.tostring(math.round(b_t1,1)) + " 15m 1:" + str.tostring(rr1) + "\n" + "TP2: " + str.tostring(math.round(b_t2,1)) + " 1H 1:" + str.tostring(rr2) + "\n" + "TP3: " + str.tostring(math.round(b_t3,1)) + " 4H 1:" + str.tostring(rr3), color=color.new(C_G,4), textcolor=C_G, style=label.style_label_up, size=size.small)

if ssig
    s_why = is_sfvg and bear_ob ? "FVG plus OB" : bear_sweep_conf ? "Liq Sweep 85%" : is_sfvg ? "FVG 76%" : bear_ob ? "OB 79%" : choch_bear ? "CHoCH Bear" : bos_bear ? "BOS Bear" : cp_hns ? "H&S 83%" : cp_dbl_top ? "Dbl Top 75%" : cp_sflag ? "Bear Flag 65%" : p_eve ? "Eve Star 70%" : p_bear_eng ? "Bear Eng 60%" : "EMA Align"
    label.new(bar_index, high + atr * 0.9, "SHORT " + str.tostring(sacc) + "pct " + str.tostring(sst) + "/7\n" + "Why: " + s_why + "\n" + "Entry: " + str.tostring(math.round(close,1)) + "\n" + "SL: " + str.tostring(math.round(s_sl,1)) + "\n" + "TP1: " + str.tostring(math.round(s_t1,1)) + " 15m 1:" + str.tostring(rr1) + "\n" + "TP2: " + str.tostring(math.round(s_t2,1)) + " 1H 1:" + str.tostring(rr2) + "\n" + "TP3: " + str.tostring(math.round(s_t3,1)) + " 4H 1:" + str.tostring(rr3), color=color.new(C_R,4), textcolor=C_R, style=label.style_label_down, size=size.small)

// ══════════════════════════════════════════════
//  SL / TP LINES
// ══════════════════════════════════════════════

var line l_en = na
var line l_sl = na
var line l_t1 = na
var line l_t2 = na
var line l_t3 = na

if i_rr and bsig
    line.delete(l_en)
    line.delete(l_sl)
    line.delete(l_t1)
    line.delete(l_t2)
    line.delete(l_t3)
    l_en := line.new(bar_index, close, bar_index + 22, close, color=color.new(C_Y,18), width=1, style=line.style_dashed)
    l_sl := line.new(bar_index, b_sl,  bar_index + 22, b_sl,  color=color.new(C_R,18), width=1, style=line.style_dashed)
    l_t1 := line.new(bar_index, b_t1,  bar_index + 22, b_t1,  color=color.new(C_G,28), width=1, style=line.style_dashed)
    l_t2 := line.new(bar_index, b_t2,  bar_index + 22, b_t2,  color=color.new(C_G,45), width=2, style=line.style_dashed)
    l_t3 := line.new(bar_index, b_t3,  bar_index + 22, b_t3,  color=color.new(C_G,62), width=1, style=line.style_dotted)

if i_rr and ssig
    line.delete(l_en)
    line.delete(l_sl)
    line.delete(l_t1)
    line.delete(l_t2)
    line.delete(l_t3)
    l_en := line.new(bar_index, close, bar_index + 22, close, color=color.new(C_Y,18), width=1, style=line.style_dashed)
    l_sl := line.new(bar_index, s_sl,  bar_index + 22, s_sl,  color=color.new(C_R,18), width=1, style=line.style_dashed)
    l_t1 := line.new(bar_index, s_t1,  bar_index + 22, s_t1,  color=color.new(C_G,28), width=1, style=line.style_dashed)
    l_t2 := line.new(bar_index, s_t2,  bar_index + 22, s_t2,  color=color.new(C_G,45), width=2, style=line.style_dashed)
    l_t3 := line.new(bar_index, s_t3,  bar_index + 22, s_t3,  color=color.new(C_G,62), width=1, style=line.style_dotted)

// ══════════════════════════════════════════════
//  DASHBOARD
//  KEY FIX: All ternaries computed at global scope
//  before the if block — single line each
// ══════════════════════════════════════════════

// Compute ALL display strings at global scope — no multiline ternaries inside if block
d_bias_s = bs > ss ? "BULLISH" : ss > bs ? "BEARISH" : "NEUTRAL"
d_bias_c = bs > ss ? C_G : ss > bs ? C_R : C_Y
d_sess_s = is_lkz ? "LONDON KZ" : is_nykz ? "NY KZ" : is_asia ? "ASIA" : "OFF HOURS"
d_sess_c = is_lkz or is_nykz ? C_G : is_asia ? C_Y : C_DIM
d_sig_s  = bsig ? "BUY " + str.tostring(bacc) + "pct" : ssig ? "SELL " + str.tostring(sacc) + "pct" : "WAIT"
d_sig_c  = bsig ? C_G : ssig ? C_R : C_DIM
d_fvg_s  = is_bfvg ? "Bull FVG 78%" : is_sfvg ? "Bear FVG 76%" : "None"
d_fvg_c  = is_bfvg ? C_G : is_sfvg ? C_R : C_DIM
d_ob_s   = bull_ob ? "OB Bull 80%" : bear_ob ? "OB Bear 79%" : "None"
d_ob_c   = bull_ob ? C_G : bear_ob ? C_R : C_DIM
d_swp_s  = bull_sweep_conf ? "Bull Sweep 85%" : bear_sweep_conf ? "Bear Sweep 85%" : bull_sweep ? "Bull Sweep 70%" : bear_sweep ? "Bear Sweep 70%" : "None"
d_swp_c  = bull_sweep ? C_T : bear_sweep ? C_O : C_DIM
d_ms_s   = choch_bull ? "CHoCH Bull" : choch_bear ? "CHoCH Bear" : bos_bull ? "BOS Bull" : bos_bear ? "BOS Bear" : "None"
d_ms_c   = choch_bull or bos_bull ? C_G : choch_bear or bos_bear ? C_R : C_DIM
d_brk_s  = bull_brk ? "Breaker Bull" : bear_brk ? "Breaker Bear" : "None"
d_brk_c  = bull_brk ? C_G : bear_brk ? C_R : C_DIM
d_eq_s   = eq_hi ? "EQH " + str.tostring(math.round(eq_hi_lvl,1)) : eq_lo ? "EQL " + str.tostring(math.round(eq_lo_lvl,1)) : "None"
d_eq_c   = eq_hi ? C_O : eq_lo ? C_T : C_DIM
d_cs_s   = p_morn ? "Morning Star 72%" : p_eve ? "Evening Star 70%" : p_bull_eng ? "Bull Engulf 63%" : p_bear_eng ? "Bear Engulf 60%" : p_hammer ? "Hammer 60%" : p_shoot ? "Shoot Star 59%" : p_drag ? "Dragonfly 62%" : p_grav ? "Gravestone 61%" : p_doji ? "Doji 50%" : gap_up ? "Gap Up 62%" : gap_dn ? "Gap Down 62%" : "None"
d_cs_c   = bull_cs ? C_G : bear_cs ? C_R : C_DIM
d_cp_c   = cp_bull_any ? C_G : cp_bear_any ? C_R : C_DIM
d_rsi_c  = rsi > 70 ? C_R : rsi < 30 ? C_G : C_Y
d_nw_s   = news_risk ? "HIGH RISK" : fri_pm ? "Fri PM" : "Clear"
d_nw_c   = news_risk or fri_pm ? C_Y : C_G
d_bacc_c = bacc >= i_acc ? C_G : C_Y
d_sacc_c = sacc >= i_acc ? C_R : C_Y
d_tgt_c  = bsig ? C_G : ssig ? C_R : C_DIM

// Step strings
d_b1 = st1b ? "Y" : "N"
d_b2 = st2b ? "Y" : "N"
d_b3 = st3  ? "Y" : "N"
d_b4 = st4b ? "Y" : "N"
d_b5 = st5b ? "Y" : "N"
d_b6 = st6b ? "Y" : "N"
d_b7 = st7  ? "Y" : "N"
d_s1 = st1s ? "Y" : "N"
d_s2 = st2s ? "Y" : "N"
d_s4 = st4s ? "Y" : "N"
d_s5 = st5s ? "Y" : "N"
d_s6 = st6s ? "Y" : "N"

d_stepb = str.tostring(bst) + "/7 " + d_b1 + d_b2 + d_b3 + d_b4 + d_b5 + d_b6 + d_b7
d_steps = str.tostring(sst) + "/7 " + d_s1 + d_s2 + d_b3 + d_s4 + d_s5 + d_s6 + d_b7

// Target strings
d_tb1 = str.tostring(math.round(b_t1,1))
d_tb2 = str.tostring(math.round(b_t2,1))
d_tb3 = str.tostring(math.round(b_t3,1))
d_ts1 = str.tostring(math.round(s_t1,1))
d_ts2 = str.tostring(math.round(s_t2,1))
d_ts3 = str.tostring(math.round(s_t3,1))
d_tgt_bull = d_tb1 + " " + d_tb2 + " " + d_tb3
d_tgt_bear = d_ts1 + " " + d_ts2 + " " + d_ts3
d_tgt_out  = bsig ? d_tgt_bull : ssig ? d_tgt_bear : "no signal"
d_rr_out   = "1:" + str.tostring(rr1) + " 1:" + str.tostring(rr2) + " 1:" + str.tostring(rr3)
d_bacc_s   = str.tostring(bacc) + "pct"
d_sacc_s   = str.tostring(sacc) + "pct"
d_e9_s     = str.tostring(math.round(e9,  1))
d_e15_s    = str.tostring(math.round(e15, 1))
d_e300_s   = str.tostring(math.round(e300,1))
d_rsi_s    = str.tostring(math.round(rsi, 1))
d_atr_s    = str.tostring(math.round(atr, 2))
d_e9_c     = e9 > e15 ? C_G : C_R
d_e300_c   = emacro ? C_G : C_R

tp_pos = i_tpos == "Top Right" ? position.top_right : i_tpos == "Top Left" ? position.top_left : i_tpos == "Bottom Right" ? position.bottom_right : position.bottom_left

var table T = table.new(tp_pos, 2, 24, bgcolor=TBL, border_color=color.new(#1e3a50,58), border_width=1, frame_color=color.new(C_B,38), frame_width=1)

if i_tbl and barstate.islast
    table.cell(T, 0, 0,  "ALGOINTEL 15m", text_color=C_B,   text_size=size.normal, bgcolor=TBL_H)
    table.cell(T, 1, 0,  "PRO v5",        text_color=C_GRY, text_size=size.small,  bgcolor=TBL_H)
    table.cell(T, 0, 1,  "EMA 9",         text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL)
    table.cell(T, 1, 1,  d_e9_s,          text_color=d_e9_c,   text_size=size.tiny, bgcolor=TBL)
    table.cell(T, 0, 2,  "EMA 15",        text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL_A)
    table.cell(T, 1, 2,  d_e15_s,         text_color=C_Y,      text_size=size.tiny, bgcolor=TBL_A)
    table.cell(T, 0, 3,  "EMA 300",       text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL)
    table.cell(T, 1, 3,  d_e300_s,        text_color=d_e300_c, text_size=size.tiny, bgcolor=TBL)
    table.cell(T, 0, 4,  "RSI 14",        text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL_A)
    table.cell(T, 1, 4,  d_rsi_s,         text_color=d_rsi_c,  text_size=size.tiny, bgcolor=TBL_A)
    table.cell(T, 0, 5,  "ATR 14",        text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL)
    table.cell(T, 1, 5,  d_atr_s,         text_color=C_TXT,    text_size=size.tiny, bgcolor=TBL)
    table.cell(T, 0, 6,  "VOLATILITY",    text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL_A)
    table.cell(T, 1, 6,  vol_lbl,         text_color=vol_col,  text_size=size.tiny, bgcolor=TBL_A)
    table.cell(T, 0, 7,  "FVG",           text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL)
    table.cell(T, 1, 7,  d_fvg_s,         text_color=d_fvg_c,  text_size=size.tiny, bgcolor=TBL)
    table.cell(T, 0, 8,  "ORDER BLOCK",   text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL_A)
    table.cell(T, 1, 8,  d_ob_s,          text_color=d_ob_c,   text_size=size.tiny, bgcolor=TBL_A)
    table.cell(T, 0, 9,  "LIQ SWEEP",     text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL)
    table.cell(T, 1, 9,  d_swp_s,         text_color=d_swp_c,  text_size=size.tiny, bgcolor=TBL)
    table.cell(T, 0, 10, "EQ LEVEL",      text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL_A)
    table.cell(T, 1, 10, d_eq_s,          text_color=d_eq_c,   text_size=size.tiny, bgcolor=TBL_A)
    table.cell(T, 0, 11, "STRUCTURE",     text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL)
    table.cell(T, 1, 11, d_ms_s,          text_color=d_ms_c,   text_size=size.tiny, bgcolor=TBL)
    table.cell(T, 0, 12, "BREAKER",       text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL_A)
    table.cell(T, 1, 12, d_brk_s,         text_color=d_brk_c,  text_size=size.tiny, bgcolor=TBL_A)
    table.cell(T, 0, 13, "CANDLE PAT",    text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL)
    table.cell(T, 1, 13, d_cs_s,          text_color=d_cs_c,   text_size=size.tiny, bgcolor=TBL)
    table.cell(T, 0, 14, "CHART PAT",     text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL_A)
    table.cell(T, 1, 14, cp_name,         text_color=d_cp_c,   text_size=size.tiny, bgcolor=TBL_A)
    table.cell(T, 0, 15, "SESSION",       text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL)
    table.cell(T, 1, 15, d_sess_s,        text_color=d_sess_c, text_size=size.tiny, bgcolor=TBL)
    table.cell(T, 0, 16, "NEWS",          text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL_A)
    table.cell(T, 1, 16, d_nw_s,          text_color=d_nw_c,   text_size=size.tiny, bgcolor=TBL_A)
    table.cell(T, 0, 17, "BIAS",          text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL)
    table.cell(T, 1, 17, d_bias_s,        text_color=d_bias_c, text_size=size.small, bgcolor=TBL)
    table.cell(T, 0, 18, "BULL ACC",      text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL_A)
    table.cell(T, 1, 18, d_bacc_s,        text_color=d_bacc_c, text_size=size.small, bgcolor=TBL_A)
    table.cell(T, 0, 19, "BULL STEPS",    text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL)
    table.cell(T, 1, 19, d_stepb,         text_color=C_G,      text_size=size.tiny, bgcolor=TBL)
    table.cell(T, 0, 20, "BEAR ACC",      text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL_A)
    table.cell(T, 1, 20, d_sacc_s,        text_color=d_sacc_c, text_size=size.small, bgcolor=TBL_A)
    table.cell(T, 0, 21, "BEAR STEPS",    text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL)
    table.cell(T, 1, 21, d_steps,         text_color=C_R,      text_size=size.tiny, bgcolor=TBL)
    table.cell(T, 0, 22, "TARGETS",       text_color=C_TXT, text_size=size.tiny,   bgcolor=TBL_A)
    table.cell(T, 1, 22, d_tgt_out,       text_color=d_tgt_c,  text_size=size.tiny, bgcolor=TBL_A)
    table.cell(T, 0, 23, "SIGNAL",        text_color=C_TXT, text_size=size.small,  bgcolor=TBL_H)
    table.cell(T, 1, 23, d_sig_s,         text_color=d_sig_c,  text_size=size.normal, bgcolor=TBL_H)

// ══════════════════════════════════════════════
//  ALERTS
// ══════════════════════════════════════════════

alertcondition(bsig,            "AI BUY",        "AlgoIntel BUY -- {{ticker}} | {{close}} | {{interval}} | {{timenow}}")
alertcondition(ssig,            "AI SELL",       "AlgoIntel SELL -- {{ticker}} | {{close}} | {{interval}} | {{timenow}}")
alertcondition(bull_sweep_conf, "AI Bull Sweep", "Bull Sweep CONFIRMED -- {{ticker}} | {{close}} | {{timenow}}")
alertcondition(bear_sweep_conf, "AI Bear Sweep", "Bear Sweep CONFIRMED -- {{ticker}} | {{close}} | {{timenow}}")
alertcondition(is_bfvg,         "AI Bull FVG",   "Bull FVG -- {{ticker}} | {{close}} | {{timenow}}")
alertcondition(is_sfvg,         "AI Bear FVG",   "Bear FVG -- {{ticker}} | {{close}} | {{timenow}}")
alertcondition(bull_ob,         "AI Bull OB",    "Bull OB -- {{ticker}} | {{close}} | {{timenow}}")
alertcondition(bear_ob,         "AI Bear OB",    "Bear OB -- {{ticker}} | {{close}} | {{timenow}}")
alertcondition(choch_bull,      "AI CHoCH Bull", "CHoCH Bull -- {{ticker}} | {{close}} | {{timenow}}")
alertcondition(choch_bear,      "AI CHoCH Bear", "CHoCH Bear -- {{ticker}} | {{close}} | {{timenow}}")
alertcondition(news_risk,       "AI News Risk",  "NEWS RISK -- {{ticker}} | {{timenow}}")
alertcondition(bos_bull or bos_bear, "AI BOS",   "BOS Break -- {{ticker}} | {{close}} | {{timenow}}")
