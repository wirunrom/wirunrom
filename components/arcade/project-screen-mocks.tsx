// Decorative app previews adapted from wirunrom-desk-fix-mock.zip.
// Every amount, name and product below is sample data.

export function FinjarWebMock() {
  return (
    <div aria-hidden="true" className="ui fin">
      <div className="sc">
        <aside className="dk">
          <span className="logo">{"finjar."}</span>
          <span className="on">{"Home"}</span>
          <span>{"Transactions"}</span>
          <span>{"Insights"}</span>
          <span>{"Forecast"}</span>
          <span className="grp">{"PLAN"}</span>
          <span>{"Money plan"}</span>
          <span>{"Goals"}</span>
          <span>{"Groups"}</span>
          <span>{"Tags"}</span>
          <span>{"Recurring"}</span>
          <span className="grp">{"RECORD"}</span>
          <span>{"Scan slip"}</span>
          <span>{"Import"}</span>
          <span className="add">{"+ Add entry"}</span>
          <span className="me">
            <i></i>
            {"alex"}
          </span>
        </aside>
        <main>
          <div className="hero dk">
            <span className="mu">{"Hi, Alex"}</span>
            <span className="mu">{"Left this cycle"}</span>
            <span className="big n">{"฿7,719.60"}</span>
            <div className="per">
              <span className="pill tint">{"←  Oct 30 – Nov 29  →"}</span>
              <span className="mu">{"44% of this cycle's income spent"}</span>
            </div>
            <div className="prog">
              <i style={{ width: "44%" }}></i>
            </div>
            <div className="stats">
              <div className="tint">
                <span className="mu">{"Income"}</span>
                <span className="n">{"฿32,500.00"}</span>
              </div>
              <div className="tint">
                <span className="mu">{"Spent"}</span>
                <span className="n">{"฿14,280.40"}</span>
              </div>
              <div className="tint">
                <span className="mu">{"Saved"}</span>
                <span className="n">{"฿8,000.00"}</span>
              </div>
              <div className="tint">
                <span className="mu">{"Invested"}</span>
                <span className="n">{"฿2,500.00"}</span>
              </div>
              <div className="tint">
                <span className="mu">{"Total savings"}</span>
                <span className="n">{"฿46,120.75"}</span>
              </div>
            </div>
          </div>
          <div className="body">
            <div className="col">
              <div className="cd">
                <div className="r">
                  <b>{"Recurring"}</b>
                  <span className="mu">{"1 due"}</span>
                </div>
                <div className="tx">
                  <i>{"↻"}</i>
                  <span>
                    {"Streaming plan"}
                    <small>
                      {"Monthly · "}
                      <span className="sg">{"Nov 4, 2026"}</span>
                    </small>
                  </span>
                  <span className="n sg">
                    {"−฿349.00"}
                    <span className="ok">{"✓"}</span>
                  </span>
                </div>
              </div>
              <div className="cd">
                <div className="r">
                  <b>{"This cycle"}</b>
                  <span className="mu">{"38 entries"}</span>
                </div>
                <div className="tx">
                  <i>{"◇"}</i>
                  <span>
                    {"Noodle bar"}
                    <small>{"Food & drink · 12:40"}</small>
                  </span>
                  <span className="n">{"−฿120.00"}</span>
                </div>
                <div className="tx">
                  <i>{"♡"}</i>
                  <span>
                    {"Badminton court"}
                    <small>{"Health · 19:10"}</small>
                  </span>
                  <span className="n">{"−฿80.00"}</span>
                </div>
                <div className="tx">
                  <i>{"◇"}</i>
                  <span>
                    {"Iced latte"}
                    <small>{"Food & drink · 08:55"}</small>
                  </span>
                  <span className="n">{"−฿65.00"}</span>
                </div>
                <div className="tx">
                  <i>{"□"}</i>
                  <span>
                    {"Online course"}
                    <small>{"Learning · 21:30"}</small>
                  </span>
                  <span className="n">{"−฿390.00"}</span>
                </div>
                <div className="tx">
                  <i>{"◇"}</i>
                  <span>
                    {"Groceries"}
                    <small>{"Food & drink · 18:05"}</small>
                  </span>
                  <span className="n">{"−฿342.00"}</span>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="cd">
                <div className="r">
                  <b>{"Forecast"}</b>
                  <span className="mu">{"23 days left"}</span>
                </div>
                <span className="mu">{"Expected at cycle end"}</span>
                <span className="fc">{"+฿2,140.00"}</span>
                <div className="r">
                  <span>{"● Streaming plan"}</span>
                  <span className="n sg">{"−฿349.00"}</span>
                </div>
                <div className="btn">{"See forecast & plan ahead"}</div>
              </div>
              <div className="cd">
                <b>{"Shortcuts"}</b>
                <div className="sh">
                  <span>
                    <i>{"◎"}</i>
                    {"Goals"}
                  </span>
                  <span>
                    <i>{"▤"}</i>
                    {"Budget"}
                  </span>
                  <span>
                    <i>{"⬡"}</i>
                    {"Groups"}
                  </span>
                  <span>
                    <i>{"◉"}</i>
                    {"Plan"}
                  </span>
                  <span>
                    <i>{"◇"}</i>
                    {"Tags"}
                  </span>
                  <span>
                    <i>{"↻"}</i>
                    {"Recurring"}
                  </span>
                  <span>
                    <i>{"⇩"}</i>
                    {"Import"}
                  </span>
                  <span>
                    <i>{"▣"}</i>
                    {"Scan slip"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export function FinjarMobileMock() {
  return (
    <div aria-hidden="true" className="ui ph">
      <div className="sc">
        <div className="top dk">
          <div className="r">
            <span className="mu">{"Hi, Alex"}</span>
            <span className="bolt tint">{"⚡ 5 days"}</span>
          </div>
          <span className="mu">{"Left this cycle"}</span>
          <span className="big n">{"฿7,719.60"}</span>
          <div className="per">
            <span className="pill tint">{"‹ Oct 30 – Nov 29 ›"}</span>
          </div>
          <span className="mu">{"44% of income spent"}</span>
          <div className="prog">
            <i style={{ width: "44%" }}></i>
          </div>
          <div className="stats">
            <div className="tint">
              <small>{"Income"}</small>
              <span className="n">{"฿32,500.00"}</span>
            </div>
            <div className="tint">
              <small>{"Spent"}</small>
              <span className="n">{"฿14,280.40"}</span>
            </div>
            <div className="tint">
              <small>{"Saved"}</small>
              <span className="n">{"฿8,000.00"}</span>
            </div>
            <div className="tint">
              <small>{"Invested"}</small>
              <span className="n">{"฿2,500.00"}</span>
            </div>
            <div className="tint">
              <small>{"Total savings"}</small>
              <span className="n">{"฿46,120.75"}</span>
            </div>
          </div>
        </div>
        <div className="sheet">
          <div className="cd">
            <div className="r">
              <b>{"Forecast"}</b>
              <span className="mu">{"23 days left"}</span>
            </div>
            <span className="mu">{"Expected at cycle end"}</span>
            <span className="fc">{"+฿2,140.00"}</span>
            <div className="btn">{"Where this comes from"}</div>
          </div>
          <div className="cd">
            <div className="r">
              <b>{"Shortcuts"}</b>
              <span className="sg">{"See all"}</span>
            </div>
          </div>
          <div className="tabbar">
            <span className="on">{"Home"}</span>
            <span>{"List"}</span>
            <span className="plus">{"Add"}</span>
            <span>{"Insights"}</span>
            <span>{"Settings"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PosHeartMock() {
  return (
    <div aria-hidden="true" className="ui pos">
      <div className="sc">
        <nav className="dk">
          <span>{"Home"}</span>
          <span className="on">
            {"Sell "}
            <kbd>{"alt 2"}</kbd>
          </span>
          <span>{"History"}</span>
          <span>{"Shifts"}</span>
          <span>{"Products"}</span>
          <span>{"Reports"}</span>
          <span>{"Settings"}</span>
          <span className="q">
            <span>{"Search or run a command"}</span>
            <kbd>{"ctrl k"}</kbd>
          </span>
        </nav>
        <div className="tb">
          <span>
            {"+ New bill "}
            <kbd>{"ctrl n"}</kbd>
          </span>
          <span>
            {"Hold "}
            <kbd>{"f4"}</kbd>
          </span>
          <span>
            {"Discount "}
            <kbd>{"f8"}</kbd>
          </span>
          <span>{"Split"}</span>
          <span>
            {"Send to kitchen "}
            <kbd>{"f10"}</kbd>
          </span>
          <span className="seg">
            <span className="on">{"Products"}</span>
            <span>{"Tables · 3 open"}</span>
          </span>
        </div>
        <div className="bd">
          <div className="bill">
            <div className="tabs">
              <span className="on">{"Current bill"}</span>
              <span>{"On hold · 2"}</span>
              <span className="n">{"5 · 9 pcs"}</span>
            </div>
            <div className="who">
              <span className="mu">{"Bill name"}</span>
              <b>{"Window table 2"}</b>
            </div>
            <div className="items">
              <div className="li">
                <span className="n">{"2"}</span>
                <span>
                  {"Iced Thai tea"}
                  <span className="mod">{"less sweet · pearls +8"}</span>
                </span>
                <span className="n">{"96.00"}</span>
              </div>
              <div className="li">
                <span className="n">{"1"}</span>
                <span>{"Basil chicken rice + egg"}</span>
                <span className="n">{"72.00"}</span>
              </div>
              <div className="li">
                <span className="n">{"2"}</span>
                <span>
                  {"Hainanese chicken rice"}
                  <span className="mod">{"no ice"}</span>
                </span>
                <span className="n">{"124.00"}</span>
              </div>
              <div className="li">
                <span className="n">{"3"}</span>
                <span>{"Chicken rice set + soup (large)"}</span>
                <span className="n">{"237.00"}</span>
              </div>
              <div className="li">
                <span className="n">{"1"}</span>
                <span>{"Still water 600 ml"}</span>
                <span className="n">{"12.00"}</span>
              </div>
            </div>
            <div className="sum">
              <div className="r">
                <span>{"Subtotal · 9 pcs"}</span>
                <span className="n">{"541.00"}</span>
              </div>
              <div className="r">
                <span>{"Promo · 40 off 500"}</span>
                <span className="n sg">{"−40.00"}</span>
              </div>
              <div className="r">
                <span>{"Service charge 10%"}</span>
                <span className="n">{"50.10"}</span>
              </div>
              <div className="r">
                <span>{"Rounding"}</span>
                <span className="n">{"−0.10"}</span>
              </div>
              <div className="r tot">
                <b>{"Total"}</b>
                <span className="n">{"฿551.00"}</span>
              </div>
              <div className="acts">
                <span>{"Kitchen · 9"}</span>
                <span className="pay">
                  {"Charge "}
                  <kbd>{"f9"}</kbd>
                </span>
              </div>
            </div>
          </div>
          <div className="cats">
            <span className="hd2">{"Categories"}</span>
            <span className="on">
              {"All"}
              <span className="n">{"12"}</span>
            </span>
            <span>
              <span>
                <i style={{ background: "var(--ink)" }}></i>
                {"Food"}
              </span>
              <span className="n">{"4"}</span>
            </span>
            <span>
              <span>
                <i style={{ background: "var(--signal)" }}></i>
                {"Drinks"}
              </span>
              <span className="n">{"4"}</span>
            </span>
            <span>
              <span>
                <i style={{ background: "var(--mute)" }}></i>
                {"Household"}
              </span>
              <span className="n">{"2"}</span>
            </span>
            <span>
              <span>
                <i
                  style={{
                    background: "var(--paper-2)",
                    boxShadow: "inset 0 0 0 1px var(--ink)",
                  }}
                ></i>
                {"Snacks"}
              </span>
              <span className="n">{"2"}</span>
            </span>
          </div>
          <div className="prods">
            <div className="q2">
              <span>{"Search by name, SKU or scan a barcode"}</span>
              <kbd>{"f2"}</kbd>
            </div>
            <div className="g">
              <div className="card sel">
                <div
                  className="th"
                  style={{
                    background:
                      "repeating-conic-gradient(var(--ink) 0 25%, var(--signal) 0 50%) 0 0 / 14px 14px",
                  }}
                ></div>
                <span className="bdg">{"1"}</span>
                <div className="nm2">{"Basil chicken rice + egg"}</div>
                <div className="r">
                  <span className="mu"></span>
                  <span className="n">{"72.00"}</span>
                </div>
              </div>
              <div className="card sel">
                <div
                  className="th"
                  style={{
                    background:
                      "repeating-conic-gradient(var(--mute) 0 25%, var(--paper-2) 0 50%) 0 0 / 14px 14px",
                  }}
                ></div>
                <span className="bdg">{"2"}</span>
                <div className="nm2">{"Hainanese chicken rice"}</div>
                <div className="r">
                  <span className="mu"></span>
                  <span className="n">{"62.00"}</span>
                </div>
              </div>
              <div className="card sel">
                <div
                  className="th"
                  style={{
                    background:
                      "repeating-conic-gradient(var(--ink) 0 25%, var(--mute) 0 50%) 0 0 / 14px 14px",
                  }}
                ></div>
                <span className="bdg">{"3"}</span>
                <div className="nm2">{"Chicken rice set (large)"}</div>
                <div className="r">
                  <span className="mu"></span>
                  <span className="n">{"79.00"}</span>
                </div>
              </div>
              <div className="card off">
                <div
                  className="th blank"
                  style={{
                    background:
                      "repeating-conic-gradient(var(--paper-2) 0 25%, var(--paper-2) 0 50%) 0 0 / 14px 14px",
                  }}
                ></div>
                <div className="nm2">{"Pad thai with prawns"}</div>
                <div className="r">
                  <span className="sg">{"paused"}</span>
                  <span className="n">{"85.00"}</span>
                </div>
              </div>
              <div className="card">
                <div
                  className="th"
                  style={{
                    background:
                      "repeating-conic-gradient(var(--ink) 0 25%, var(--paper-2) 0 50%) 0 0 / 14px 14px",
                  }}
                ></div>
                <div className="nm2">{"Iced americano"}</div>
                <div className="r">
                  <span className="mu"></span>
                  <span className="n">{"55.00"}</span>
                </div>
              </div>
              <div className="card sel">
                <div
                  className="th"
                  style={{
                    background:
                      "repeating-conic-gradient(var(--signal) 0 25%, var(--paper) 0 50%) 0 0 / 14px 14px",
                  }}
                ></div>
                <span className="bdg">{"2"}</span>
                <div className="nm2">{"Iced Thai tea"}</div>
                <div className="r">
                  <span className="mu"></span>
                  <span className="n">{"48.00"}</span>
                </div>
              </div>
              <div className="card sel">
                <div
                  className="th"
                  style={{
                    background:
                      "repeating-conic-gradient(var(--signal) 0 25%, var(--paper-2) 0 50%) 0 0 / 14px 14px",
                  }}
                ></div>
                <span className="bdg">{"1"}</span>
                <div className="nm2">{"Still water 600 ml"}</div>
                <div className="r">
                  <span className="mu">{"86 left"}</span>
                  <span className="n">{"12.00"}</span>
                </div>
              </div>
              <div className="card">
                <div
                  className="th blank"
                  style={{
                    background:
                      "repeating-conic-gradient(var(--paper-2) 0 25%, var(--paper-2) 0 50%) 0 0 / 14px 14px",
                  }}
                ></div>
                <div className="nm2">{"Soda 325 ml"}</div>
                <div className="r">
                  <span className="sg">{"4 left"}</span>
                  <span className="n">{"18.00"}</span>
                </div>
              </div>
              <div className="card off">
                <div
                  className="th"
                  style={{
                    background:
                      "repeating-conic-gradient(var(--mute) 0 25%, var(--paper-2) 0 50%) 0 0 / 14px 14px",
                  }}
                ></div>
                <div className="nm2">{"Paper towels, 6 rolls"}</div>
                <div className="r">
                  <span className="sg">{"sold out"}</span>
                  <span className="n">{"109.00"}</span>
                </div>
              </div>
              <div className="card">
                <div
                  className="th"
                  style={{
                    background:
                      "repeating-conic-gradient(var(--ink) 0 25%, var(--paper) 0 50%) 0 0 / 14px 14px",
                  }}
                ></div>
                <div className="nm2">{"Laundry detergent 2.7 kg"}</div>
                <div className="r">
                  <span className="sg">{"6 left"}</span>
                  <span className="n">{"389.00"}</span>
                </div>
              </div>
              <div className="card">
                <div
                  className="th"
                  style={{
                    background:
                      "repeating-conic-gradient(var(--signal) 0 25%, var(--paper-2) 0 50%) 0 0 / 14px 14px",
                  }}
                ></div>
                <div className="nm2">{"Pandan custard toast"}</div>
                <div className="r">
                  <span className="mu"></span>
                  <span className="n">{"39.00"}</span>
                </div>
              </div>
              <div className="card">
                <div
                  className="th blank"
                  style={{
                    background:
                      "repeating-conic-gradient(var(--paper-2) 0 25%, var(--paper-2) 0 50%) 0 0 / 14px 14px",
                  }}
                ></div>
                <div className="nm2">{"Potato chips 75 g"}</div>
                <div className="r">
                  <span className="mu">{"21 left"}</span>
                  <span className="n">{"29.00"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="st dk">
          <span>{"● Alex"}</span>
          <span className="mu">{"Offline · data stays on this device"}</span>
          <span>{"Shift open · 09:02"}</span>
          <span>
            {"Drawer "}
            <span className="n">{"3,840.50"}</span>
          </span>
          <span className="mu">{"No printer set"}</span>
          <span style={{ marginLeft: "auto" }}>{"EN · mouse/keyboard"}</span>
          <span className="n">{"14:36"}</span>
        </div>
      </div>
    </div>
  )
}
