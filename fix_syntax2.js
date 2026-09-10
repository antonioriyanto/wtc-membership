import fs from 'fs';

let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

const target1 = `                        Use Now
                      </button>
                  </div>
                ))}
              </div>
            </section>`;

const rep1 = `                        Use Now
                      </button>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>`;

content = content.replace(target1, rep1);

fs.writeFileSync('src/components/CustomerMemberView.tsx', content);

