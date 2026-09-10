import fs from 'fs';

let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

const target1 = `                    </div>
                  </div>
                ))}
              </div>
            </section>`;

const rep1 = `                  </div>
                ))}
              </div>
            </section>`;

content = content.replace(target1, rep1);

fs.writeFileSync('src/components/CustomerMemberView.tsx', content);

