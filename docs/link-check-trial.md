# Link check trial — 2026-09-23

*Generated 2026-09-22T23:51:05Z from the first full run of `scripts/check-links.mjs` over 784 unique URLs. First run only: none of these is confirmed yet (the weekly job needs two consecutive failures). Each is a lead for a steward to re-verify, not a verdict.*

Totals: 24 broken before tuning, of which 12 were TLS-chain or HTTP/2 client errors now reclassified as unknown · 111 unknown (100 × 403, 11 timeouts) · 26 moved to another host.

## Returned 404 or did not resolve

| URL | Result | Record |
| --- | --- | --- |
| https://oeil.europarl.europa.eu/oeil/en/home | 404 | `content/bodies/eu/eu-european-parliament-rapporteur-shadow-rapporteur-system.yml` route membership<br>`content/bodies/eu/eu-european-parliament-rapporteur-shadow-rapporteur-system.yml` route public-route<br>`content/bodies/eu/eu-european-parliament-rapporteur-shadow-rapporteur-system.yml` source |
| https://www.aisi.gov.uk/contact | 404 | `content/bodies/gb/gb-ai-security-institute.yml` route aisi-contact-page<br>`content/bodies/gb/gb-ai-security-institute.yml` source |
| https://transparency.oecd.ai/ | ENOTFOUND | `content/bodies/global/global-g7-hiroshima-ai-process-reporting-framework.yml` route haip-transparency-reporting-portal<br>`content/bodies/global/global-g7-hiroshima-ai-process-reporting-framework.yml` source |
| https://impact.indiaai.gov.in/stakeholder-consultation | 404 | `content/bodies/in/in-india-ai-impact-summit-2026.yml` route public-route<br>`content/bodies/in/in-india-ai-impact-summit-2026.yml` source |
| https://www.parliament.nz/en/pb/sc/scl/economic-development-science-and-innovation/ | 404 | `content/bodies/nz/nz-economic-development.yml` route membership<br>`content/bodies/nz/nz-economic-development.yml` source |
| https://www.parliament.nz/en/pb/sc/scl/petitions/ | 404 | `content/bodies/nz/nz-petitions-committee.yml` route membership<br>`content/bodies/nz/nz-petitions-committee.yml` source |
| https://www.parliament.nz/en/pb/sc/how-to-make-a-submission/ | 404 | `content/bodies/nz/nz-economic-development.yml` route public-route<br>`content/bodies/nz/nz-economic-development.yml` source<br>`content/bodies/nz/nz-education-workforce-committee.yml` route public-route<br>`content/bodies/nz/nz-education-workforce-committee.yml` source<br>`content/bodies/nz/nz-new-zealand-house-representatives-select-committee.yml` route public-route<br>`content/bodies/nz/nz-new-zealand-house-representatives-select-committee.yml` source |
| https://www.parliament.nz/en/pb/petitions/ | 404 | `content/bodies/nz/nz-petitions-committee.yml` route public-route<br>`content/bodies/nz/nz-petitions-committee.yml` source |
| https://www.parliament.nz/en/pb/sc/scl/education-and-workforce/ | 404 | `content/bodies/nz/nz-education-workforce-committee.yml` route membership<br>`content/bodies/nz/nz-education-workforce-committee.yml` source |
| https://www.parliament.nz/en/pb/sc/ | 404 | `content/bodies/nz/nz-new-zealand-house-representatives-select-committee.yml` route membership<br>`content/bodies/nz/nz-new-zealand-house-representatives-select-committee.yml` source |
| https://pal.assembly.go.kr/ | 404 | `content/bodies/kr/kr-national-assembly-science.yml` route public-route<br>`content/bodies/kr/kr-national-assembly-science.yml` source |
| https://www.g42.ai/contact-us | 404 | `content/channels/ae/ae-g42.yml` route no-verified-safety-channel<br>`content/channels/ae/ae-g42.yml` source |

## Redirected to another host — check the record still points at the right page

| URL | Now | Record |
| --- | --- | --- |
| https://edemocracia.camara.leg.br/ | https://www.camara.leg.br/participe | `content/bodies/br/br-chamber-deputies-e-democracia-participa-brasil.yml`<br>`content/bodies/br/br-chamber-deputies-e-democracia-participa-brasil.yml` |
| https://ai-development-and-safety-network.cn/institutes | https://beijing-aisi.ac.cn/?lng=en | `content/bodies/cn/cn-china-ai-safety-development-association.yml`<br>`content/bodies/cn/cn-china-ai-safety-development-association.yml` |
| https://www.canada.ca/en/innovation-science-economic-development.html | https://ised-isde.canada.ca/site/ised/en | `content/bodies/ca/ca-government-canada-minister-artificial-intelligence-digital.yml`<br>`content/bodies/ca/ca-government-canada-minister-artificial-intelligence-digital.yml` |
| https://un.us19.list-manage.com/subscribe?u=8b32a6b56219d56e50ca23917&id=a9a462d861 | https://www.us19.list-manage.com/subscribe?u=8b32a6b56219d56e50ca23917&id=a9a462d861 | `content/bodies/global/global-independent-international-scientific-panel-ai.yml`<br>`content/bodies/global/global-independent-international-scientific-panel-ai.yml` |
| https://www.cisa.gov/report | https://myservices.cisa.gov/irf | `content/bodies/us/federal/us-cybersecurity-infrastructure-security-agency.yml`<br>`content/bodies/us/federal/us-cybersecurity-infrastructure-security-agency.yml` |
| https://www.federalregister.gov/agencies/energy-department | https://unblock.federalregister.gov/ | `content/bodies/us/federal/us-department-energy-national-laboratories.yml`<br>`content/bodies/us/federal/us-department-energy-national-laboratories.yml` |
| https://www.federalregister.gov/agencies/national-institute-of-standards-and-technology | https://unblock.federalregister.gov/ | `content/bodies/us/federal/us-national-institute-standards-technology-information-technology.yml` |
| https://www.federalregister.gov/d/2026-10779 | https://unblock.federalregister.gov/ | `content/bodies/us/federal/us-nist-ai-consortium.yml`<br>`content/bodies/us/federal/us-nist-ai-consortium.yml` |
| https://www.federalregister.gov/ | https://unblock.federalregister.gov/ | `content/bodies/us/federal/us-regulations-gov-federal-register.yml`<br>`content/bodies/us/federal/us-regulations-gov-federal-register.yml` |
| https://www.federalregister.gov/agencies/science-and-technology-policy-office | https://unblock.federalregister.gov/ | `content/bodies/us/federal/us-white-house-office-science-technology-policy.yml`<br>`content/bodies/us/federal/us-white-house-office-science-technology-policy.yml` |
| https://coral.cohere.com/ | https://dashboard.cohere.com/welcome/login | `content/channels/ca/ca-cohere.yml`<br>`content/channels/ca/ca-cohere.yml` |
| https://z.ai/ | https://chat.z.ai/ | `content/channels/cn/cn-zhipu-ai-z-ai.yml`<br>`content/channels/cn/cn-zhipu-ai-z-ai.yml` |
| https://yiyan.baidu.com/ | https://wenxin.baidu.com/?enter_type=yiyan_site | `content/channels/cn/cn-baidu.yml`<br>`content/channels/cn/cn-baidu.yml` |
| https://ratings.safer-ai.org/ | https://tracker.safer-ai.org/ | `content/channels/fr/fr-saferai.yml`<br>`content/channels/fr/fr-saferai.yml` |
| https://developers.facebook.com/llama_output_feedback/ | https://business.facebook.com/business/loginpage/?next=https%3A%2F%2Fdevelopers.facebook.com%2Fllama_output_feedback%2F | `content/channels/us/us-meta.yml`<br>`content/channels/us/us-meta.yml` |
| https://go.microsoft.com/fwlink/?linkid=2299798 | https://msrc.microsoft.com/report/ | `content/channels/us/us-microsoft.yml`<br>`content/channels/us/us-microsoft.yml` |
| https://facebook.com/whitehat/info/ | https://bugbounty.meta.com/terms/?utm_source=facebook.com&utm_medium=redirect | `content/channels/us/us-meta.yml`<br>`content/channels/us/us-meta.yml` |
| https://www.federalregister.gov/documents/2026/08/12/2026-16371/request-for-information-rfi-on-modernizing-the-national-vulnerability-database-in-the-age-of | https://unblock.federalregister.gov/ | `content/channels/us/us-nist-caisi-requests-information-ai.yml`<br>`content/channels/us/us-nist-caisi-requests-information-ai.yml` |
| https://security.apple.com/submit/ | https://idmsa.apple.com/IDMSWebAuth/signin?appIdKey=992b008db1a63b0ce3eb77a87d2d37b37e4fbc768dcbc1279386dd6fce827761&rv=2&path=%2Fsubmit%2F | `content/channels/us/us-apple.yml`<br>`content/channels/us/us-apple.yml` |
| https://www.adalovelaceinstitute.org/newsletter-subscribe | https://nuffieldfoundation.tfaforms.net/149 | `content/orgs/gb/gb-ada-lovelace-institute.yml`<br>`content/orgs/gb/gb-ada-lovelace-institute.yml` |
| https://controlai.org/take-action | https://act.controlai.org/ | `content/orgs/gb/gb-controlai.yml`<br>`content/orgs/gb/gb-controlai.yml` |
| https://discord.gg/2XXWXvErfA | https://discord.com/invite/2XXWXvErfA | `content/orgs/global/global-pauseai.yml`<br>`content/orgs/global/global-pauseai.yml` |
| https://lu.ma/stopai_info | https://luma.com/stopai_info | `content/orgs/global/global-stopai.yml`<br>`content/orgs/global/global-stopai.yml` |
| https://hwcdc27ergv.feishu.cn/share/base/form/shrcnujPFnMnEL4tFrtPLXV9qad | https://my.feishu.cn/share/base/form/shrcnujPFnMnEL4tFrtPLXV9qad (redirect token removed) | `content/orgs/cn/cn-pku-alignment-group-center-ai-safety.yml`<br>`content/orgs/cn/cn-pku-alignment-group-center-ai-safety.yml` |
| https://discord.gg/zBGx3azzUn | https://discord.com/invite/zBGx3azzUn | `content/orgs/us/us-eleutherai.yml`<br>`content/orgs/us/us-eleutherai.yml` |
| https://act.citizen.org/ | https://www.engagingnetworks.net/ | `content/orgs/us/us-public-citizen.yml`<br>`content/orgs/us/us-public-citizen.yml` |
