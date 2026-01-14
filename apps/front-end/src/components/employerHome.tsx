import Link from 'next/link';

export default function EmployerHome() {
  return (
    <>
      {/* Features */}
      <section className="border-t border-black/10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-2xl font-semibold text-center mb-12">
            Ажил олгогчийн боломжууд
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/createJob">
              <Feature title="Ажил нэмэх" desc="Цагийн ажил шинээр үүсгэх" />
            </Link>

            <Link href="/requests">
              <Feature
                title="Хүсэлтүүд харах"
                desc="Ажил хайгчдын илгээсэн хүсэлтүүдийг удирдах"
              />
            </Link>

            <Feature
              title="Үнэлгээ өгөх"
              desc="Ажил гүйцэтгэлийн дараа үнэлгээ өгөх"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-black/10 p-6 text-center">
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-black/70">{desc}</p>
    </div>
  );
}
