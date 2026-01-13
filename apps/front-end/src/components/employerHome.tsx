import Link from 'next/link';

export default function EmployerHome() {
  return (
    <>
      {/* Hero */}
      <section>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl font-bold mb-6">Ажил олгогчийн самбар</h2>
          <p className="max-w-3xl mx-auto mb-10 text-black/70">
            Шинэ ажлын зар үүсгэж, тохирох ажил хайгчдыг олоорой
          </p>

          <Link
            href="/createJob"
            className="px-8 py-4 rounded-xl border border-black font-medium hover:bg-black hover:text-white transition"
          >
            Ажил нэмэх
          </Link>

          <Link
            href="/requests"
            className="px-8 py-4 rounded-xl border border-black font-medium hover:bg-black hover:text-white transition"
          >
            Хүсэлтүүд харах
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-black/10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-2xl font-semibold text-center mb-12">
            Ажил олгогчийн боломжууд
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature title="Ажил нэмэх" desc="Цагийн ажил шинээр үүсгэх" />
            <Feature
              title="Хүсэлтүүд харах"
              desc="Ажил хайгчдын илгээсэн хүсэлтүүдийг удирдах"
            />
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
