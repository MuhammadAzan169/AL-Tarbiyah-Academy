## BrightPath Learning roadmap

- [x] Foundation: brand configuration, design system, motion, shared layout, mock data
- [x] Public pages: Home, How It Works, Subjects, Library, Parents, Tutors, Pricing, About, Contact, Login, 404
- [x] Product experiences: Parent, Student, Teacher, Admin portals
- [x] Interactive features: subject explorer, journey demo, tutor matching, curriculum map, library, exam builder,
      mini diagnostic, quiz runner, earnings calculator, command palette
- [x] UX states: loading, empty, error, success, toasts (previewable from the portal top bar)
- [x] Responsive and accessibility QA across target sizes and themes (axe: 0 violations, light + dark)

### Possible next steps

- [ ] Real authentication and API layer (all data currently lives in `src/data/*`)
- [ ] Persist portal interactions (currently local component state by design)
- [ ] Localisation (copy is English-only today)
- [ ] Automated visual regression + unit tests
